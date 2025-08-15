import "../assets/css/Home.css";
import Slider from "../components/Slider"; 
import Footer from "../components/Footer"; 
import CommunityNotice from "../components/CommunityNotice";
import CardSection from "../components/CardSection";
import ContactSection from "../components/ContactSection";
import LatestNewsSection from "../components/LatestNewsSection";
import FeatureSection from '../components/FeatureSection';
import WorkSection from "../components/WorkSection";

export default function Home() {
  return (
    <div className="home-container pb-0">
      <Slider />
      <CommunityNotice />
      <FeatureSection />
      <CardSection />
      <WorkSection />
      <LatestNewsSection />
      <ContactSection />
      <Footer />
    </div>
  );
}
