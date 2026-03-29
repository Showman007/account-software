class AddDriveFieldsToEntriesAndExpenses < ActiveRecord::Migration[8.0]
  def change
    add_column :outbound_entries, :drive_file_id, :string
    add_column :outbound_entries, :drive_file_name, :string
    add_column :outbound_entries, :drive_file_url, :string

    add_column :inbound_entries, :drive_file_id, :string
    add_column :inbound_entries, :drive_file_name, :string
    add_column :inbound_entries, :drive_file_url, :string

    add_column :expenses, :drive_file_id, :string
    add_column :expenses, :drive_file_name, :string
    add_column :expenses, :drive_file_url, :string
  end
end
