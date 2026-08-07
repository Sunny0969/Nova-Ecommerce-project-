import React from 'react';
import { RotateCcw } from 'lucide-react';
import LegalPolicyLayout from '../components/LegalPolicyLayout';
import { businessDisplayName } from '../utils/businessContact';
import { RETURNS_REFUND_META, RETURNS_REFUND_SECTIONS } from '../data/returnsRefundPolicyContent';

export default function ReturnsRefundPolicy() {
  return (
    <LegalPolicyLayout
      path="/returns-and-refunds"
      breadcrumbLabel="Returns & Refunds"
      meta={RETURNS_REFUND_META}
      sections={RETURNS_REFUND_SECTIONS}
      icon={RotateCcw}
      seoTopic="Returns and refunds"
      seoLead={`Learn how ${businessDisplayName} handles returns, replacements, and refunds for online grocery orders in Pakistan.`}
      seoFallback={`${businessDisplayName} returns and refunds policy.`}
      contactTitle="Need help with a return?"
      contactIntro="Tell us your order number and describe the issue — we will review eligible returns and refunds promptly."
    />
  );
}
