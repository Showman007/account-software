module Api
  module V1
    class JournalEntriesController < BaseController
      def index
        scope = policy_scope(JournalEntry).includes(:journal_lines)
        scope = scope.by_date_range(params[:from_date], params[:to_date])
        scope = scope.by_type(params[:entry_type]) if params[:entry_type].present?
        scope = scope.where('narration ILIKE ?', "%#{params[:q]}%") if params[:q].present?
        scope = apply_sorting(scope)

        if params[:all] == 'true'
          records = scope.all
          render json: {
            data: JournalEntrySerializer.render_as_hash(records),
            summary: build_summary(scope)
          }
        else
          records, meta = paginate(scope)
          render json: {
            data: JournalEntrySerializer.render_as_hash(records),
            meta: meta,
            summary: build_summary(scope)
          }
        end
      end

      def show
        entry = JournalEntry.includes(:journal_lines).find(params[:id])
        authorize entry
        render json: { data: JournalEntrySerializer.render_as_hash(entry) }
      end

      # POST /api/v1/journal_entries/backfill
      # Admin only - creates journal entries for all existing records
      def backfill
        authorize JournalEntry.new, :backfill?
        count = JournalService.backfill_all!
        render json: { message: "Created #{count} journal entries", count: count }
      end

      private

      def build_summary(scope)
        unordered = scope.reorder('')
        {
          total_entries: unordered.count,
          total_debit: unordered.joins(:journal_lines).sum('journal_lines.debit'),
          total_credit: unordered.joins(:journal_lines).sum('journal_lines.credit'),
          by_type: unordered.reselect(:entry_type).group(:entry_type).count
        }
      end
    end
  end
end
