class CreateAttachmentsTable < ActiveRecord::Migration[8.0]
  def change
    create_table :attachments do |t|
      t.string  :attachable_type, null: false
      t.bigint  :attachable_id, null: false
      t.string  :drive_file_id, null: false
      t.string  :file_name, null: false
      t.string  :file_type, null: false
      t.integer :file_size, null: false
      t.string  :drive_url
      t.bigint  :uploaded_by_id
      t.timestamps
    end

    add_index :attachments, [:attachable_type, :attachable_id], name: "index_attachments_on_attachable"
    add_index :attachments, :drive_file_id, unique: true

    # Remove drive fields from individual tables
    remove_column :outbound_entries, :drive_file_id, :string
    remove_column :outbound_entries, :drive_file_name, :string
    remove_column :outbound_entries, :drive_file_url, :string

    remove_column :inbound_entries, :drive_file_id, :string
    remove_column :inbound_entries, :drive_file_name, :string
    remove_column :inbound_entries, :drive_file_url, :string

    remove_column :expenses, :drive_file_id, :string
    remove_column :expenses, :drive_file_name, :string
    remove_column :expenses, :drive_file_url, :string
  end
end
