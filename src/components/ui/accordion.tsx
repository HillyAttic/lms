"use client";
import { PlusIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { createContext, useContext, useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Types
type AccordionType = "single" | "multiple";

interface AccordionContextValue {
  toggleItem: (value: string) => void;
  isItemOpen: (value: string) => boolean;
  type: AccordionType;
}

interface AccordionItemContextValue {
  value: string;
  isOpen: boolean;
}

interface AccordionProps {
  children: ReactNode;
  type?: AccordionType;
  collapsible?: boolean;
  defaultValue?: string | string[] | null;
  value?: string | string[];
  onValueChange?: (value: any) => void;
  className?: string;
}

interface AccordionItemProps {
  children: ReactNode;
  value: string;
  className?: string;
}

interface AccordionTriggerProps {
  children: ReactNode;
  className?: string;
}

interface AccordionContentProps {
  children: ReactNode;
  className?: string;
}

// Accordion Context
const AccordionContext = createContext<AccordionContextValue | null>(null);

const useAccordionContext = (): AccordionContextValue => {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error("Accordion components must be used within Accordion");
  }
  return context;
};

// Accordion Item Context
const AccordionItemContext = createContext<AccordionItemContextValue | null>(
  null,
);

const useAccordionItemContext = (): AccordionItemContextValue => {
  const context = useContext(AccordionItemContext);
  if (!context) {
    throw new Error(
      "AccordionTrigger and AccordionContent must be used within AccordionItem",
    );
  }
  return context;
};

// Main Accordion Component
export const Accordion = ({
  children,
  type = "single",
  collapsible = false,
  defaultValue = null,
  value: controlledValue,
  onValueChange,
  className,
}: AccordionProps) => {
  const isControlled = controlledValue !== undefined;

  const [internalOpenItems, setInternalOpenItems] = useState<string[]>(() => {
    if (isControlled) return [];
    if (!defaultValue) return [];
    if (type === "single") {
      return typeof defaultValue === "string" ? [defaultValue] : [];
    }
    return Array.isArray(defaultValue) ? defaultValue : [];
  });

  const openItems = isControlled
    ? typeof controlledValue === "string"
      ? controlledValue
        ? [controlledValue]
        : []
      : Array.isArray(controlledValue)
        ? controlledValue
        : []
    : internalOpenItems;

  const toggleItem = (itemValue: string): void => {
    let newOpenItems: string[] = [];

    if (type === "single") {
      const isOpen = openItems.includes(itemValue);
      if (isOpen && collapsible) {
        newOpenItems = [];
      } else if (isOpen) {
        newOpenItems = openItems;
      } else {
        newOpenItems = [itemValue];
      }
    } else {
      newOpenItems = openItems.includes(itemValue)
        ? openItems.filter((item) => item !== itemValue)
        : [...openItems, itemValue];
    }

    if (!isControlled) {
      setInternalOpenItems(newOpenItems);
    }

    if (onValueChange) {
      if (type === "single") {
        onValueChange(newOpenItems[0] || "");
      } else {
        onValueChange(newOpenItems);
      }
    }
  };

  const isItemOpen = (value: string): boolean => openItems.includes(value);

  return (
    <AccordionContext.Provider value={{ toggleItem, isItemOpen, type }}>
      <div className={cn(`w-full`, className)}>{children}</div>
    </AccordionContext.Provider>
  );
};

// Accordion Item Component
export const AccordionItem = ({
  children,
  value,
  className,
}: AccordionItemProps) => {
  const { isItemOpen } = useAccordionContext();
  const isOpen = isItemOpen(value);

  return (
    <AccordionItemContext.Provider value={{ value, isOpen }}>
      <div
        data-state={isOpen ? "active" : "inactive"}
        className={cn(
          `border-b-[1.5px] border-ink transition-colors duration-300`,
          className,
        )}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
};

// Accordion Trigger Component
export const AccordionTrigger = ({
  children,
  className,
}: AccordionTriggerProps) => {
  const { toggleItem } = useAccordionContext();
  const { value, isOpen } = useAccordionItemContext();

  return (
    <button
      onClick={() => toggleItem(value)}
      aria-expanded={isOpen}
      data-state={isOpen ? "active" : "inactive"}
      type="button"
      className={cn(
        `flex w-full items-center justify-between gap-4 py-6 text-start text-lg font-semibold transition-colors duration-300 hover:text-secondary sm:py-7 sm:text-xl`,
        className,
      )}
    >
      {children}
      <span
        aria-hidden="true"
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-full border-[1.5px] border-ink transition-transform duration-300",
          isOpen ? "rotate-45 bg-accent" : "bg-transparent",
        )}
      >
        <PlusIcon />
      </span>
    </button>
  );
};

// Accordion Content Component
export const AccordionContent = ({
  children,
  className,
}: AccordionContentProps) => {
  const { isOpen } = useAccordionItemContext();

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="content"
          initial={{ height: 0, opacity: 0 }}
          animate={{
            height: "auto",
            opacity: 1,
            transition: {
              height: { duration: 0.3, ease: "easeInOut" },
              opacity: { duration: 0.2, delay: 0.1 },
            },
          }}
          exit={{
            height: 0,
            opacity: 0,
            transition: {
              height: { duration: 0.3, ease: "easeInOut" },
              opacity: { duration: 0.1 },
            },
          }}
          className="origin-top overflow-hidden"
        >
          <div
            data-state={isOpen ? "active" : "inactive"}
            className={cn(
              `max-w-3xl pb-7 leading-7 text-secondary`,
              className,
            )}
          >
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
