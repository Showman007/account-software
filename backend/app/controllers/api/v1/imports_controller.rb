module Api
  module V1
    class ImportsController < BaseController
      def create
        unless params[:file].present?
          return render json: { error: 'No file uploaded' }, status: :unprocessable_entity
        end

        result = ExcelImportService.new(params[:file]).call

        if result[:success]
          render json: {
            message: 'Import completed successfully',
            data: result[:summary]
          }, status: :created
        else
          render json: {
            error: 'Import failed',
            details: result[:errors]
          }, status: :unprocessable_entity
        end
      end
    end
  end
end
