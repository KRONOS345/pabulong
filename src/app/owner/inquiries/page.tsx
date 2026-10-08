import * as React from "react";
import Link from "next/link";
import { MessageSquare, ArrowLeft } from "lucide-react";
import { InquiryInbox } from "@/components/owner/inquiry-inbox";
import {
  getOwnerInquiriesAction,
  getOwnerPropertiesAction,
} from "@/actions/marketplace";

export const dynamic = "force-dynamic";

export default async function OwnerInquiriesPage() {
  const [inquiries, properties] = await Promise.all([
    getOwnerInquiriesAction(),
    getOwnerPropertiesAction(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2 pb-4 border-b border-border/40">
        <div className="flex items-center gap-2 mb-1">
          <Link
            href="/owner"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Overview
          </Link>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
          <MessageSquare className="h-7 w-7 text-purple-500" />
          Seeker Inquiry Inbox
        </h1>
        <p className="text-sm text-muted-foreground">
          Review student inquiries, contact potential boarders, and manage room viewing requests.
        </p>
      </div>

      <InquiryInbox initialInquiries={inquiries} properties={properties} />
    </div>
  );
}
