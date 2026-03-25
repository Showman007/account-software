module Api
  module V1
    class MasterLedgerController < BaseController
      def index
        from_date = params[:from_date]
        to_date = params[:to_date]
        data = MasterLedgerService.new(from_date: from_date, to_date: to_date).call
        render json: { data: data }
      end
    end
  end
end
