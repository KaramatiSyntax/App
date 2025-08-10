'use client';
import { cn } from '@/lib/utils';
import {
  AnimatePresence,
  motion
} from 'motion/react';
import React from 'react';

const defaultStaggerTimes = {
  char: 0.02,
  word: 0.04,
  line: 0.08,
};

const defaultContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.02,
      delayChildren: 0.1,
    },
  },
  exit: {
    transition: { staggerChildren: 0.02, staggerDirection: -1 },
  },
};

const defaultItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: { opacity: 0, y: -10 },
};

const presetVariants = {
  blur: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, filter: 'blur(12px)' },
      visible: { 
        opacity: 1, 
        filter: 'blur(0px)',
        transition: {
          duration: 0.4,
          ease: "easeOut"
        }
      },
      exit: { opacity: 0, filter: 'blur(12px)' },
    },
  },
  'fade-in-blur': {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, y: 20, filter: 'blur(12px)' },
      visible: { 
        opacity: 1, 
        y: 0, 
        filter: 'blur(0px)',
        transition: {
          duration: 0.5,
          ease: "easeOut"
        }
      },
      exit: { opacity: 0, y: 20, filter: 'blur(12px)' },
    },
  },
  scale: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, scale: 0 },
      visible: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0 },
    },
  },
  fade: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
      exit: { opacity: 0 },
    },
  },
  slide: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 20 },
    },
  },
};

const AnimationComponent = React.memo(({ segment, variants, per, segmentWrapperClassName, isColored }) => {
  const content =
    per === 'line' ? (
      <motion.span variants={variants} className={cn('block', isColored && 'text-cyan-500')}>
        {segment}
      </motion.span>
    ) : per === 'word' ? (
      <motion.span
        aria-hidden='true'
        variants={variants}
        className={cn('inline-block whitespace-pre', isColored && 'text-cyan-500')}
      >
        {segment}
      </motion.span>
    ) : (
      <motion.span className={cn('inline-block whitespace-pre', isColored && 'text-cyan-500')}>
        {segment.split('').map((char, charIndex) => (
          <motion.span
            key={`char-${charIndex}`}
            aria-hidden='true'
            variants={variants}
            className={cn('inline-block whitespace-pre', isColored && 'text-cyan-500')}
          >
            {char}
          </motion.span>
        ))}
      </motion.span>
    );

  if (!segmentWrapperClassName) {
    return content;
  }

  const defaultWrapperClassName = per === 'line' ? 'block' : 'inline-block';

  return (
    <span className={cn(defaultWrapperClassName, segmentWrapperClassName, isColored && 'text-cyan-500')}>
      {content}
    </span>
  );
});

AnimationComponent.displayName = 'AnimationComponent';

const splitText = (text, per) => {
  if (text === null || text === undefined) return [];
  if (typeof text !== 'string') {
    console.warn('TextEffect: children must be a string, received:', typeof text);
    return [];
  }
  if (per === 'line') return text.split('\n');
  return text.split(/(\s+)/);
};

const hasTransition = (variant) => {
  if (!variant) return false;
  return typeof variant === 'object' && 'transition' in variant;
};

const createVariantsWithTransition = (baseVariants, transition) => {
  if (!transition) return baseVariants;

  const { exit: _, ...mainTransition } = transition;

  return {
    ...baseVariants,
    visible: {
      ...baseVariants.visible,
      transition: {
        ...(hasTransition(baseVariants.visible)
          ? baseVariants.visible.transition
          : {}),
        ...mainTransition,
      },
    },
    exit: {
      ...baseVariants.exit,
      transition: {
        ...(hasTransition(baseVariants.exit)
          ? baseVariants.exit.transition
          : {}),
        ...mainTransition,
        staggerDirection: -1,
      },
    },
  };
};

export function TextEffect({
  children,
  per = 'word',
  as = 'p',
  variants,
  className,
  preset = 'fade',
  delay = 0,
  speedReveal = 1,
  speedSegment = 1,
  trigger = true,
  onAnimationComplete,
  onAnimationStart,
  segmentWrapperClassName,
  containerTransition,
  segmentTransition,
  style,
}) {
  if (children === null || children === undefined) {
    console.warn('TextEffect: children prop is required');
    return null;
  }

  const processChildren = (children) => {
    if (typeof children === 'string') {
      return [{ text: children, isColored: false }];
    }

    if (React.isValidElement(children)) {
      if (children.type === 'span') {
        const spanText = children.props.children;
        return [{ text: typeof spanText === 'string' ? spanText : String(spanText), isColored: true }];
      }
      
      if (children.props.children) {
        if (typeof children.props.children === 'string') {
          return [{ text: children.props.children, isColored: false }];
        }
        
        if (Array.isArray(children.props.children)) {
          return children.props.children.flatMap(child => {
            if (typeof child === 'string') {
              return [{ text: child, isColored: false }];
            }
            if (React.isValidElement(child) && child.type === 'span') {
              const spanText = child.props.children;
              return [{ text: typeof spanText === 'string' ? spanText : String(spanText), isColored: true }];
            }
            return [];
          });
        }
      }
    }

    return [{ text: String(children), isColored: false }];
  };

  const textParts = processChildren(children);
  const textContent = textParts.map(part => part.text).join(' ');
  const coloredSegments = textParts.filter(part => part.isColored).map(part => part.text);

  if (!textContent) {
    console.warn('TextEffect: no text content found in children');
    return null;
  }
  
  const segments = splitText(textContent, per);
  const MotionTag = motion[as] || motion.div;

  const baseVariants = preset
    ? presetVariants[preset]
    : { container: defaultContainerVariants, item: defaultItemVariants };

  const stagger = defaultStaggerTimes[per] / speedReveal;

  const baseDuration = 0.3 / speedSegment;

  const customStagger = hasTransition(variants?.container?.visible)
    ? variants?.container?.visible.transition?.staggerChildren
    : undefined;

  const customDelay = hasTransition(variants?.container?.visible)
    ? variants?.container?.visible.transition?.delayChildren
    : undefined;

  const computedVariants = {
    container: createVariantsWithTransition(
      variants?.container || baseVariants.container,
      {
        ...containerTransition,
        delay: delay,
      }
    ),
    item: createVariantsWithTransition(
      variants?.item || baseVariants.item,
      segmentTransition
    ),
  };

  return (
    <AnimatePresence mode="wait">
      {trigger && (
        <MotionTag
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={computedVariants.container}
          className={cn("inline-flex items-center gap-2", className)}
          style={style}
          onAnimationStart={onAnimationStart}
          onAnimationComplete={onAnimationComplete}
        >
          {segments.map((segment, index) => {
            const isColored = coloredSegments.some(coloredText => 
              segment.includes(coloredText)
            );
            
            return (
              <AnimationComponent
                key={`segment-${index}`}
                segment={segment}
                variants={computedVariants.item}
                per={per}
                segmentWrapperClassName={segmentWrapperClassName}
                isColored={isColored}
              />
            );
          })}
        </MotionTag>
      )}
    </AnimatePresence>
  );
} 