class AttachmentSerializer < Blueprinter::Base
  identifier :id

  fields :drive_file_id, :file_name, :file_type, :file_size,
         :drive_url, :uploaded_by_id, :created_at
end
