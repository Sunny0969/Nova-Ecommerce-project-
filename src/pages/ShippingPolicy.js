import React from 'react';
import { Truck } from 'lucide-react';
import LegalPolicyLayout from '../components/LegalPolicyLayout';
import { businessDisplayName } from '../utils/businessContact';
import { SHIPPING_POLICY_META, SHIPPING_POLICY_SECTIONS } from '../data/shippingPolicyContent';

export default function ShippingPolicy() {
  return (
    <LegalPolicyLayout
      path="/shipping-policy"
      breadcrumbLabel="Shipping Policy"
      meta={SHIPPING_POLICY_META}
      sections={SHIPPING_POLICY_SECTIONS}
      icon={Truck}
      seoTopic="Shipping and delivery policy"
      seoLead={`Delivery options, shipping fees, and service standards for ${businessDisplayName} orders across Pakistan.`}
      seoFallback={`${businessDisplayName} shipping policy.`}
      contactTitle="Delivery questions?"
      contactIntro="Our team can help with shipping fees, delivery areas, and order tracking."
    />
  );
}
