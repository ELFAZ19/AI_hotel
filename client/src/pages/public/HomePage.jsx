import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRoomTypes } from "../../services/roomService";
import SearchBar from "../../components/booking/SearchBar";
import { MapPin, Clock, Utensils, CalendarDays, Star } from "lucide-react";

export default function HomePage() {
  const navigate = useNavigate();
  const [featuredTypes, setFeaturedTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await getRoomTypes();
        if (res.success && res.data) {
          // Show first 4 room types
          setFeaturedTypes(res.data.slice(0, 4));
        }
      } catch (error) {
        console.error("Failed to fetch room types:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTypes();
  }, []);

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative h-[85vh] min-h-[600px] flex items-center justify-center overflow-hidden bg-navy-950">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source
            src="https://res.cloudinary.com/ddizm5aqs/video/upload/v1780870997/V2_Watermarked-22473C0a-2322-45B8-8C55-C9c4527ab90a_jlvxtf.mp4"
            type="video/mp4"
          />
          {/* Fallback image if video fails */}
          <img src="https://interluxuryhotel.com/" alt="Hotel Interior" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/50 to-navy-950/40"></div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto animate-fade-in-up">
          <p className="text-gold-400 font-medium tracking-[0.2em] uppercase text-sm mb-2 mt-12">
            Dire Dawa's Premier Destination
          </p>
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-white mb-6 leading-tight">
            Experience <span className="italic font-light">Luxury</span> at{" "}
            <br />
            <span className="text-gradient font-bold">Adane International</span>
          </h1>
          <p className="text-gray-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto font-light tracking-wide">
            Where Ethiopian hospitality meets world-class comfort. Discover an
            oasis of elegance in the heart of the city.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate("/rooms")}
              className="w-full sm:w-auto px-8 py-4 bg-gold-500 hover:bg-gold-600 text-navy-900 rounded-xl font-medium transition-colors shadow-lg shadow-gold-500/20"
            >
              Book Your Stay
            </button>
            <button
              onClick={() => {
                document
                  .getElementById("featured-rooms")
                  .scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm rounded-xl font-medium transition-colors border border-white/20"
            >
              Explore Rooms
            </button>
          </div>
        </div>
      </section>

      {/* Search Bar Section (overlapping hero) */}
      <section className="relative z-20 -mt-16 px-4">
        <SearchBar />
      </section>

      {/* Featured Rooms */}
      <section id="featured-rooms" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-gold-500 font-medium tracking-[0.2em] uppercase text-sm mb-3">
              Our Accommodation
            </h2>
            <h3 className="font-serif text-4xl text-navy-900 font-medium mb-4">
              Featured <span className="italic font-light">Rooms</span>
            </h3>
            <p className="text-gray-600 font-light tracking-wide">
              Designed with your comfort in mind, our rooms offer the perfect
              blend of modern amenities and elegant design.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-96 bg-gray-200 rounded-2xl animate-pulse"
                ></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredTypes.map((type) => (
                <div
                  key={type.id}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100"
                >
                  <div className="h-48 bg-navy-100 overflow-hidden relative">
                    <img
                      src={`https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=800&auto=format&fit=crop&sig=${type.id}`}
                      alt={type.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute bottom-3 left-3 glass-dark rounded-lg px-3 py-1 text-white font-bold text-sm">
                      From ETB {type.base_price}
                    </div>
                  </div>
                  <div className="p-5">
                    <h4 className="font-serif text-lg font-bold text-navy-900 mb-2">
                      {type.name}
                    </h4>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                      {type.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {type.amenities?.slice(0, 3).map((a) => (
                        <span
                          key={a}
                          className="text-[10px] px-2 py-1 bg-gray-100 text-gray-600 rounded"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => navigate(`/rooms?type=${type.id}`)}
                      className="w-full py-2 text-sm font-medium text-navy-600 hover:text-navy-900 border border-navy-200 hover:border-navy-900 rounded-lg transition-colors"
                    >
                      View Availability
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {[
              {
                icon: MapPin,
                title: "Prime Location",
                desc: "Situated in the heart of Dire Dawa with easy access to attractions.",
              },
              {
                icon: Clock,
                title: "24/7 Service",
                desc: "Our dedicated staff is always available to attend to your needs.",
              },
              {
                icon: Utensils,
                title: "Fine Dining",
                desc: "Experience culinary excellence at our signature restaurants.",
              },
              {
                icon: CalendarDays,
                title: "Event Facilities",
                desc: "State-of-the-art venues for your meetings and celebrations.",
              },
            ].map((feature, idx) => (
              <div key={idx} className="text-center group">
                <div className="w-16 h-16 mx-auto bg-gold-50 rounded-2xl flex items-center justify-center mb-6 group-hover:-translate-y-2 transition-transform duration-300">
                  <feature.icon className="w-8 h-8 text-gold-500" />
                </div>
                <h4 className="font-serif text-xl font-bold text-navy-900 mb-3">
                  {feature.title}
                </h4>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-navy-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-gold-500 font-medium tracking-[0.2em] uppercase text-sm mb-3">
            Testimonials
          </h2>
          <h3 className="font-serif text-4xl font-medium mb-16">
            What Our <span className="italic font-light">Guests</span> Say
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah M.",
                text: "The most luxurious experience in Dire Dawa. The staff went above and beyond to make our stay memorable.",
              },
              {
                name: "David L.",
                text: "Exceptional dining and incredibly comfortable rooms. Will definitely be returning on my next business trip.",
              },
              {
                name: "Elena K.",
                text: "A true oasis. The attention to detail in the room design and the level of service are unmatched.",
              },
            ].map((review, idx) => (
              <div
                key={idx}
                className="bg-navy-900/50 p-8 rounded-2xl border border-navy-800"
              >
                <div className="flex justify-center gap-1 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="w-5 h-5 text-gold-500 fill-gold-500"
                    />
                  ))}
                </div>
                <p className="text-gray-300 italic mb-6">"{review.text}"</p>
                <h4 className="font-medium text-white">— {review.name}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gold-500">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-serif text-4xl text-navy-950 font-medium mb-6">
            Ready to Experience{" "}
            <span className="italic font-light">Luxury</span>?
          </h2>
          <p className="text-navy-900/80 text-lg mb-10 font-light tracking-wide">
            Book your stay today and discover the perfect blend of comfort and
            elegance.
          </p>
          <button
            onClick={() => navigate("/rooms")}
            className="px-8 py-4 bg-navy-950 hover:bg-navy-900 text-white rounded-xl font-medium transition-colors shadow-xl"
          >
            Make a Reservation
          </button>
        </div>
      </section>
    </div>
  );
}
