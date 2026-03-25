module Api
  module V1
    class DashboardController < BaseController
      def index
        from_date = params[:from_date]
        to_date = params[:to_date]
        data = DashboardService.new(from_date: from_date, to_date: to_date).call
        render json: { data: data }
      end
    end
  end
end
