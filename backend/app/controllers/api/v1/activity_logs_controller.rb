module Api
  module V1
    class ActivityLogsController < BaseController
      # Skip activity tracking for this controller (avoid recursive logging)
      skip_after_action :log_activity, raise: false
      skip_after_action :log_view_activity, raise: false

      def index
        scope = policy_scope(ActivityLog).includes(:user)
        scope = scope.by_user(params[:user_id]) if params[:user_id].present?
        scope = scope.joins(:user).where(users: { email: params[:user_email] }) if params[:user_email].present?
        scope = scope.by_action(params[:action_type]) if params[:action_type].present?
        scope = scope.by_resource(params[:resource_type]) if params[:resource_type].present?
        scope = scope.where('activity_logs.created_at >= ?', params[:from_date].to_date.beginning_of_day) if params[:from_date].present?
        scope = scope.where('activity_logs.created_at <= ?', params[:to_date].to_date.end_of_day) if params[:to_date].present?

        if params[:q].present?
          scope = scope.where('resource_label ILIKE ?', "%#{params[:q]}%")
        end

        scope = scope.order(created_at: :desc)

        records, meta = paginate(scope)
        render json: {
          data: ActivityLogSerializer.render_as_hash(records),
          meta: meta
        }
      end

      def summary
        authorize ActivityLog, :index?

        days = (params[:days] || 7).to_i.clamp(1, 90)
        since = days.days.ago

        logs = ActivityLog.where('activity_logs.created_at >= ?', since)
        logs = logs.joins(:user).where(users: { email: params[:user_email] }) if params[:user_email].present?

        # Hourly activity breakdown (0-23)
        hourly = logs.group("EXTRACT(HOUR FROM activity_logs.created_at)::int").count
                     .transform_keys { |k| k.to_i.to_s }

        # Per-user daily activity (for heatmap)
        user_daily = logs.joins(:user)
                         .group('users.email', "DATE(activity_logs.created_at)")
                         .count
                         .each_with_object({}) do |((email, date), count), hash|
                           hash[email] ||= {}
                           hash[email][date.to_s] = count
                         end

        # Write actions only (create/update/destroy) per user
        write_actions = logs.where(action: %w[create update destroy])
                            .joins(:user)
                            .group('users.email', 'activity_logs.action')
                            .count
                            .each_with_object({}) do |((email, action), count), hash|
                              hash[email] ||= {}
                              hash[email][action] = count
                            end

        render json: {
          data: {
            total_actions: logs.count,
            actions_by_type: logs.group(:action).count,
            actions_by_resource: logs.group(:resource_type).count.reject { |k, _| k.blank? },
            actions_by_user: logs.joins(:user).group('users.email').count,
            daily_activity: logs.group("DATE(activity_logs.created_at)").count.transform_keys(&:to_s),
            hourly_activity: hourly,
            user_daily_activity: user_daily,
            write_actions_by_user: write_actions,
            most_active_users: logs.joins(:user)
                                   .group('users.email')
                                   .order('count_all DESC')
                                   .limit(10)
                                   .count
          }
        }
      end
    end
  end
end
