import { ArrowRight, ArrowLeft } from "lucide-react";
import type { Transfer } from "@/lib/db/transfers";

interface TransferCardProps {
  transfer: Transfer;
}

const transferTypeColors: Record<string, string> = {
  permanent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  loan: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  free: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

export function TransferCard({ transfer }: TransferCardProps) {
  const typeColor = transferTypeColors[transfer.transfer_type?.toLowerCase() || ""] ||
    "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {transfer.player_name?.charAt(0) || "?"}
          </span>
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">
            {transfer.player_name}
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>{transfer.from_team}</span>
            {transfer.transfer_type === "loan" ? (
              <ArrowRight className="w-4 h-4 text-yellow-500" />
            ) : (
              <ArrowRight className="w-4 h-4 text-gray-400" />
            )}
            <span>{transfer.to_team}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {transfer.transfer_fee && transfer.transfer_fee !== "Free" && (
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {transfer.transfer_fee}
          </span>
        )}
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${typeColor}`}>
          {transfer.transfer_type || "Unknown"}
        </span>
      </div>
    </div>
  );
}
