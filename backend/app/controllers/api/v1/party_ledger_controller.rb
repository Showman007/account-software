module Api
  module V1
    class PartyLedgerController < BaseController
      def show
        party = Party.find(params[:id])
        from_date = params[:from_date]
        to_date = params[:to_date]
        data = PartyLedgerService.new(party: party, from_date: from_date, to_date: to_date).call
        render json: { data: data }
      end
    end
  end
end
