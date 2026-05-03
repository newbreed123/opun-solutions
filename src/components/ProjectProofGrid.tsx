import Section from "./Section";

interface ProjectType {
  title: string;
  challenge: string;
  improvement: string;
  value: string;
}

interface ProjectProofGridProps {
  bgColor?: "primary" | "secondary";
  title?: string;
  description?: string;
  projects?: ProjectType[];
}

const defaultProjects: ProjectType[] = [
  {
    title: "Ecommerce Operations Support",
    challenge:
      "Store had strong traffic but checkout abandonment and manual fulfillment were eating into margins.",
    improvement:
      "Built checkout optimization, order routing, and fulfillment workflows.",
    value:
      "Customers completed more orders. Operations team stopped manual handoffs.",
  },
  {
    title: "Sales Coach Website & Lead Flow",
    challenge:
      "Needed a way to capture qualified leads and automatically qualify incoming prospects.",
    improvement:
      "Built conversion-focused website with AI assistant to pre-qualify inquiries.",
    value:
      "More qualified leads reached the sales team. Sales team spent less time on initial screening.",
  },
  {
    title: "Care Agency Website & Inquiry Flow",
    challenge:
      "Booking process was manual. Clients couldn't get information without calling.",
    improvement:
      "Built client portal and automated booking with inquiry tracking.",
    value:
      "Customers booked appointments themselves. Customer satisfaction improved.",
  },
];

export default function ProjectProofGrid({
  bgColor = "secondary",
  title = "How We Help Real Businesses",
  description = "These aren't redesigns — they're system fixes that improve how businesses operate and grow.",
  projects = defaultProjects,
}: ProjectProofGridProps) {
  return (
    <Section bgColor={bgColor} padded={true}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 text-center">
          <h2 className="heading-2 mb-4">{title}</h2>
          <p className="body-lg text-secondary max-w-3xl mx-auto">
            {description}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.title}
              className="rounded-[2rem] border border-white/10 bg-dark-bg p-8 shadow-lg shadow-black/10"
            >
              <h3 className="heading-4 mb-4 text-white">{project.title}</h3>

              <div className="mb-4">
                <p className="text-brand-blue uppercase tracking-[0.24em] text-xs font-semibold mb-2">
                  The Challenge
                </p>
                <p className="body-md text-secondary">{project.challenge}</p>
              </div>

              <div className="mb-4">
                <p className="text-brand-blue uppercase tracking-[0.24em] text-xs font-semibold mb-2">
                  What We Built
                </p>
                <p className="body-md text-secondary">{project.improvement}</p>
              </div>

              <div className="pt-4 border-t border-white/10">
                <p className="text-brand-blue uppercase tracking-[0.24em] text-xs font-semibold mb-2">
                  Business Value
                </p>
                <p className="body-md text-secondary">{project.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
