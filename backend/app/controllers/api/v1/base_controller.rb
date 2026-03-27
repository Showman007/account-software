module Api
  module V1
    class BaseController < ApplicationController
      private

      def apply_filters(scope)
        scope = scope.where('date >= ?', params[:from_date]) if params[:from_date].present?
        scope = scope.where('date <= ?', params[:to_date]) if params[:to_date].present?
        scope
      end

      def apply_numeric_filters(scope, allowed_columns = [])
        operators = { 'gt' => '>', 'gte' => '>=', 'lt' => '<', 'lte' => '<=', 'eq' => '=' }
        pattern = /\A(#{allowed_columns.map { |c| Regexp.escape(c) }.join('|')})_(gt|gte|lt|lte|eq)\z/

        params.each do |key, value|
          next unless value.present?
          match = key.match(pattern)
          next unless match

          column = match[1]
          op = operators[match[2]]
          scope = scope.where("#{column} #{op} ?", BigDecimal(value.to_s))
        end
        scope
      end

      def apply_sorting(scope)
        sort_col = params[:sort] || 'created_at'
        sort_dir = params[:order]&.downcase == 'asc' ? :asc : :desc
        if scope.column_names.include?(sort_col)
          scope.order(sort_col => sort_dir)
        else
          scope.order(created_at: :desc)
        end
      end
    end
  end
end
