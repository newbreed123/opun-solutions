export type OpzixBrainConcept =
  | "tracking_visibility"
  | "conversion_path"
  | "offer_clarity"
  | "lead_capture"
  | "follow_up_speed"
  | "crm_routing"
  | "product_discovery"
  | "booking_flow"
  | "trust_signals"
  | "ai_assistant";

export type OpzixBrainIndustry =
  | "ecommerce_dtc"
  | "industrial_b2b_catalog"
  | "marketplace_retail"
  | "real_estate"
  | "healthcare_care"
  | "service_business"
  | "local_service"
  | "education"
  | "restaurant_hospitality"
  | "unknown";

export type OpzixBrainEntry = {
  concept: OpzixBrainConcept;
  title: string;
  shortDefinition: string;
  whyItMatters: string;
  businessRisk: string;
  whatGoodLooksLike: string;
  commonMistakes: string[];
  whatOpzixWouldValidate: string[];
  relatedConcepts: OpzixBrainConcept[];
  industryVariants: Partial<
    Record<
      OpzixBrainIndustry,
      {
        explanation: string;
        examples: string[];
        whatToValidate: string[];
      }
    >
  >;
};

export type ConceptDetectionResult = {
  concept: OpzixBrainConcept | null;
  confidence: "High" | "Moderate" | "Low";
  matchedTerms: string[];
};

export type OpzixBrainButton =
  | "Run Free Audit"
  | "Book Strategy Call"
  | "Ask Another Question";
