import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Rajesh Kumar",
    role: "PG Owner, Bangalore",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=rajesh",
    rating: 5,
    content:
      "Managing 3 PG properties was a nightmare before PG Buddy. Now I track everything from my phone. Rent collection is so smooth with UPI integration!",
  },
  {
    name: "Priya Sharma",
    role: "Tenant, Mumbai",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=priya",
    rating: 5,
    content:
      "Found my PG through this app and paying rent is super easy. No more cash hassles. The complaint system is also very helpful.",
  },
  {
    name: "Arun Patel",
    role: "PG Owner, Pune",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=arun",
    rating: 5,
    content:
      "The expense tracking feature has helped me understand my actual profits. I can now make better business decisions. Highly recommended!",
  },
  {
    name: "Sneha Reddy",
    role: "Tenant, Hyderabad",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=sneha",
    rating: 5,
    content:
      "Submitting my vacancy notice was just one click. Got my deposit back on time. The whole experience was transparent and professional.",
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-24 sm:py-32 relative overflow-hidden">
      <div className="absolute inset-0 gradient-subtle" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            💬 Testimonials
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
            Loved by <span className="gradient-text">Thousands</span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            See what PG owners and tenants across India are saying about us.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-5 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
            >
              <div className="h-full p-6 bg-card rounded-2xl border border-border/60 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5">
                {/* Quote + Rating row */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Quote className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-warning text-warning" />
                    ))}
                  </div>
                </div>

                <p className="text-foreground mb-6 leading-relaxed text-sm">
                  "{testimonial.content}"
                </p>

                <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-10 h-10 rounded-full bg-muted ring-2 ring-primary/10"
                  />
                  <div>
                    <div className="font-semibold text-sm">{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
