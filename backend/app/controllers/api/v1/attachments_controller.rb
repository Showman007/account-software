module Api
  module V1
    class AttachmentsController < BaseController
      ATTACHABLE_TYPES = {
        "outbound_entries" => OutboundEntry,
        "inbound_entries" => InboundEntry,
        "expenses" => Expense
      }.freeze

      SUBFOLDER_MAP = {
        "OutboundEntry" => "Sale Invoices",
        "InboundEntry" => "Credit Notes",
        "Expense" => "Expense Receipts"
      }.freeze

      before_action :ensure_drive_configured

      def create
        record = find_record
        authorize record, :update?

        if record.attachment.present?
          return render json: { error: "A file is already attached. Remove it first." }, status: :unprocessable_entity
        end

        file = params[:file]
        validate_file!(file)

        drive = GoogleDriveService.new
        result = drive.upload(file, subfolder: SUBFOLDER_MAP[record.class.name])

        attachment = record.create_attachment!(
          drive_file_id: result[:file_id],
          file_name: result[:file_name],
          file_type: file.content_type,
          file_size: file.size,
          drive_url: result[:file_url],
          uploaded_by: current_user
        )

        render json: { data: AttachmentSerializer.render_as_hash(attachment) }, status: :created
      rescue GoogleDriveService::DriveError => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      def show
        record = find_record
        authorize record, :show?

        attachment = record.attachment
        unless attachment
          return render json: { error: "No file attached" }, status: :not_found
        end

        drive = GoogleDriveService.new
        file_content = drive.download(attachment.drive_file_id)

        send_data file_content,
                  filename: attachment.file_name,
                  type: attachment.file_type,
                  disposition: "inline"
      rescue GoogleDriveService::DriveError => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      def destroy
        record = find_record
        authorize record, :update?

        attachment = record.attachment
        unless attachment
          return render json: { error: "No file attached" }, status: :not_found
        end

        drive = GoogleDriveService.new
        drive.delete(attachment.drive_file_id)
        attachment.destroy!

        head :no_content
      rescue GoogleDriveService::DriveError => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      private

      def find_record
        klass = ATTACHABLE_TYPES[params[:attachable_type]]
        raise ActiveRecord::RecordNotFound, "Invalid type" unless klass

        klass.find(params[:attachable_id])
      end

      def validate_file!(file)
        raise GoogleDriveService::DriveError, "No file provided" unless file.present?
        raise GoogleDriveService::DriveError, "File size must be less than 1 MB" if file.size > 1.megabyte

        allowed = %w[application/pdf image/jpeg image/png]
        unless allowed.include?(file.content_type)
          raise GoogleDriveService::DriveError, "Only PDF, JPG, and PNG files are allowed"
        end
      end

      def ensure_drive_configured
        return if GOOGLE_DRIVE_CONFIGURED

        render json: { error: "Google Drive is not configured. Please set the required environment variables." }, status: :service_unavailable
      end
    end
  end
end
