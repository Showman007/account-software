module Api
  module V1
    class QueryRunnerController < BaseController
      before_action :authorize_admin!

      # POST /api/v1/query_runner
      def execute
        sql = params[:sql].to_s.strip

        if sql.blank?
          return render json: { error: 'SQL query is required' }, status: :unprocessable_entity
        end

        # Security: only allow SELECT statements
        unless read_only_query?(sql)
          return render json: { error: 'Only SELECT queries are allowed' }, status: :forbidden
        end

        begin
          started_at = Time.current
          result = ActiveRecord::Base.connection.exec_query(sql)
          duration_ms = ((Time.current - started_at) * 1000).round(2)

          render json: {
            columns: result.columns,
            rows: result.rows,
            row_count: result.rows.length,
            duration_ms: duration_ms
          }
        rescue ActiveRecord::StatementInvalid => e
          render json: { error: e.message.sub(/^PG::.*ERROR:\s*/, '') }, status: :unprocessable_entity
        rescue StandardError => e
          render json: { error: e.message }, status: :internal_server_error
        end
      end

      # GET /api/v1/query_runner/tables
      def tables
        tables_info = ActiveRecord::Base.connection.tables.sort.map do |table_name|
          columns = ActiveRecord::Base.connection.columns(table_name).map do |col|
            { name: col.name, type: col.sql_type, nullable: col.null }
          end
          { name: table_name, columns: columns }
        end

        render json: { tables: tables_info }
      end

      private

      def authorize_admin!
        unless current_user&.admin?
          render json: { error: 'Admin access required' }, status: :forbidden
        end
      end

      def read_only_query?(sql)
        # Strip comments and normalize
        clean = sql.gsub(/--.*$/, '').gsub(/\/\*.*?\*\//m, '').strip.downcase

        # Must start with SELECT or WITH (for CTEs)
        return false unless clean.match?(/\A\s*(select|with)\b/)

        # Block any dangerous keywords
        dangerous = /\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|execute|exec|copy|pg_read_file|pg_write_file|lo_import|lo_export)\b/i
        return false if clean.match?(dangerous)

        true
      end
    end
  end
end
