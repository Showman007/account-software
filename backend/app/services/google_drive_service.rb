require "google/apis/drive_v3"
require "googleauth"

class GoogleDriveService
  MAX_FILE_SIZE = 1.megabyte
  ALLOWED_MIME_TYPES = %w[
    application/pdf
    image/jpeg
    image/png
  ].freeze

  class DriveError < StandardError; end

  def initialize
    @drive = Google::Apis::DriveV3::DriveService.new
    @drive.authorization = authorize
    @folder_id = ENV.fetch("GOOGLE_DRIVE_FOLDER_ID")
  end

  def upload(file, subfolder: nil)
    validate_file!(file)

    target_folder = subfolder ? find_or_create_subfolder(subfolder) : @folder_id

    metadata = Google::Apis::DriveV3::File.new(
      name: file.original_filename,
      parents: [target_folder]
    )

    result = @drive.create_file(
      metadata,
      upload_source: file.tempfile,
      content_type: file.content_type,
      fields: "id, name, webViewLink"
    )

    {
      file_id: result.id,
      file_name: result.name,
      file_url: result.web_view_link
    }
  end

  def delete(file_id)
    @drive.delete_file(file_id)
    true
  rescue Google::Apis::ClientError => e
    raise DriveError, "Failed to delete file: #{e.message}" unless e.status_code == 404
    true
  end

  def get_file_url(file_id)
    file = @drive.get_file(file_id, fields: "webViewLink")
    file.web_view_link
  end

  private

  def authorize
    Google::Auth::UserRefreshCredentials.new(
      client_id: ENV.fetch("GOOGLE_CLIENT_ID"),
      client_secret: ENV.fetch("GOOGLE_CLIENT_SECRET"),
      refresh_token: ENV.fetch("GOOGLE_REFRESH_TOKEN"),
      scope: ["https://www.googleapis.com/auth/drive.file"]
    )
  end

  def validate_file!(file)
    raise DriveError, "No file provided" unless file.present?
    raise DriveError, "File size exceeds 1 MB limit" if file.size > MAX_FILE_SIZE

    unless ALLOWED_MIME_TYPES.include?(file.content_type)
      raise DriveError, "File type not allowed. Only PDF, JPG, and PNG files are accepted"
    end
  end

  def find_or_create_subfolder(name)
    query = "name = '#{name}' and '#{@folder_id}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
    results = @drive.list_files(q: query, fields: "files(id)")

    if results.files.any?
      results.files.first.id
    else
      folder_metadata = Google::Apis::DriveV3::File.new(
        name: name,
        mime_type: "application/vnd.google-apps.folder",
        parents: [@folder_id]
      )
      folder = @drive.create_file(folder_metadata, fields: "id")
      folder.id
    end
  end
end
