import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigation } from "@/hooks/useNavigation";

interface BackButtonProps {
  className?: string;
  fallbackPath?: string;
}

const BackButton = ({ className, fallbackPath = "/" }: BackButtonProps) => {
  const { goBack, canGoBack } = useNavigation();

  const handleBack = () => {
    if (canGoBack) {
      goBack();
    } else {
      // Fallback navigation
      window.location.href = fallbackPath;
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={handleBack}
      className={className}
    >
      <ArrowLeft size={20} />
    </Button>
  );
};

export default BackButton;