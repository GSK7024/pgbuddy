import StaticPageLayout from "./StaticPageLayout";

const posts = [
  { title: "5 Tips to Increase PG Occupancy Rates", date: "Mar 2, 2026", summary: "Struggling with vacant rooms? Here are proven strategies to keep your PG fully occupied year-round." },
  { title: "How to Handle Late Rent Payments Gracefully", date: "Feb 18, 2026", summary: "Practical advice on setting up payment reminders and handling defaulters without damaging relationships." },
  { title: "Digital vs Paper Rent Agreements: What PG Owners Need to Know", date: "Feb 5, 2026", summary: "Why digital agreements are the future and how to make the switch for your PG." },
  { title: "The Complete PG Owner's Checklist for New Tenant Onboarding", date: "Jan 22, 2026", summary: "From document verification to room allocation — a step-by-step guide for smooth onboarding." },
];

const Blog = () => (
  <StaticPageLayout title="Blog" description="Tips, guides, and insights for PG owners and tenants. Learn how to manage your PG business better." canonical="/blog">
    <p>Tips, guides, and insights for PG owners and tenants.</p>

    <div className="space-y-6 mt-4">
      {posts.map((post) => (
        <div key={post.title} className="border border-border rounded-xl p-5 hover:border-primary/30 transition-colors">
          <p className="text-xs text-muted-foreground mb-1">{post.date}</p>
          <h3 className="text-lg font-semibold text-foreground mb-2">{post.title}</h3>
          <p className="text-sm">{post.summary}</p>
        </div>
      ))}
    </div>

    <p className="text-sm mt-4">More articles coming soon. Stay tuned!</p>
  </StaticPageLayout>
);

export default Blog;
