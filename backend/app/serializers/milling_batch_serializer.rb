class MillingBatchSerializer < Blueprinter::Base
  identifier :id

  fields :date, :paddy_type, :miller_name, :input_qty, :milling_cost,
         :rice_main_qty, :broken_rice_qty, :rice_bran_qty, :husk_qty,
         :rice_flour_qty, :total_output, :loss_diff,
         :created_at, :updated_at
end
