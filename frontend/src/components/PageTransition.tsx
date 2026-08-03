import { motion } from "framer-motion";

interface Props {
  children: React.ReactNode;
  className?: string;
}

export default function PageTransition({ children, className = "" }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: "tween", ease: [0.25, 0.1, 0.25, 1], duration: 0.3 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
