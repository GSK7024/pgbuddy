import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Rajesh Kumar",
    role: "PG Owner, Bangalore",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=rajesh",
    rating: 5,
    content:
      "Managing 3 PG properties was a nightmare before PG Manager. Now I track everything from my phone. Rent collection is so smooth with UPI integration!",
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
    <section className="py-20 sm:py-32 bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            Testimonials
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Loved by <span className="gradient-text">Thousands</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            See what PG owners and tenants across India are saying about us.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="h-full p-6 bg-card rounded-2xl border border-border hover:shadow-lg transition-shadow">
                {/* Quote Icon */}
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Quote className="w-5 h-5 text-primary" />
                </div>

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-warning text-warning"
                    />
                  ))}
                </div>

                {/* Content */}
                <p className="text-foreground mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full bg-muted"
                  />
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </div>
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
