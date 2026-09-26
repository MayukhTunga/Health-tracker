"use client";

import { Button } from "./button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { syncGoogleFit } from "@/app/actions";

export function SyncButton() {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    await syncGoogleFit();
    setIsSyncing(false);
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleSync}
      disabled={isSyncing}
      className="text-xs h-8 bg-card border-primary/20 text-primary hover:bg-primary/10 transition-all shadow-sm"
    >
      <RefreshCw className={`w-3 h-3 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
      {isSyncing ? "Syncing..." : "Sync Fit"}
    </Button>
  );
}
