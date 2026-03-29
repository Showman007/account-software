class Attachment < ApplicationRecord
  belongs_to :attachable, polymorphic: true
  belongs_to :uploaded_by, class_name: "User", optional: true

  validates :drive_file_id, presence: true, uniqueness: true
  validates :file_name, presence: true
  validates :file_type, presence: true
  validates :file_size, presence: true, numericality: { greater_than: 0, less_than_or_equal_to: 1.megabyte }
  validates :file_type, inclusion: {
    in: %w[application/pdf image/jpeg image/png],
    message: "must be PDF, JPG, or PNG"
  }
end
