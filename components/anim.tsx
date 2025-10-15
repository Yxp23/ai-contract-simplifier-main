"use client";

import { motion, Variants } from "framer-motion";
import { PropsWithChildren } from "react";

const baseFade: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export function FadeIn(props: PropsWithChildren<{ delay?: number }>) {
  const { children, delay = 0 } = props;
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={{
        hidden: baseFade.hidden,
        show: {
          ...(baseFade.show as object),
          // build transition inline to avoid typing issues
          transition: { duration: 0.45, ease: "easeOut", delay },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function Stagger(
  props: PropsWithChildren<{ delay?: number; gap?: number }>
) {
  const { children, delay = 0, gap = 0.06 } = props;
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={{
        hidden: {},
        show: {
          transition: { staggerChildren: gap, delayChildren: delay },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function MotionButton({ children }: PropsWithChildren) {
  return (
    <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
      {children}
    </motion.div>
  );
}