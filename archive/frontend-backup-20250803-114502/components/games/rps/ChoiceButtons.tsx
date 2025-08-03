'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { Choice } from './types';

interface ChoiceButtonsProps {
  onChoice: (choice: Choice) => void;
  selectedChoice: Choice | null;
  disabled: boolean;
  isPopup?: boolean;
  cooldown?: boolean;
}

const choiceConfig = {
  rock: { emoji: '🪨', label: '바위' },
  paper: { emoji: '📄', label: '보' },
  scissors: { emoji: '✂️', label: '가위' }
};

const choices: Choice[] = ['rock', 'paper', 'scissors'];

export const ChoiceButtons: React.FC<ChoiceButtonsProps> = ({
  onChoice,
  selectedChoice,
  disabled,
  isPopup = false,
  cooldown = false
}) => {
  const containerClass = "choice-buttons-container";
  const buttonClass = isPopup ? "choice-button-popup" : "choice-button-normal";

  const buttonVariants = {
    initial: (index: number) => ({
      opacity: 0,
      y: 30,
      scale: 0.8,
      transition: { 
        delay: index * 0.15,
      }
    }),
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { 
        duration: 0.6,
        type: "spring" as const, 
        stiffness: 280, 
        damping: 20
      }
    },
    hover: {
      scale: 1.08,
      y: -6,
      transition: { 
        duration: 0.3,
        type: "spring" as const,
        stiffness: 400,
        damping: 15
      }
    },
    tap: { 
      scale: 0.95,
      y: 2,
      transition: { 
        duration: 0.15,
        type: "tween" as const 
      }
    },
    selected: {
      scale: [1, 1.15, 1.1],
      boxShadow: [
        "0px 0px 0px rgba(255,199,0,0)", 
        "0px 0px 35px rgba(255,199,0,0.9)", 
        "0px 0px 25px rgba(255,199,0,0.7)"
      ],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        repeatType: "reverse" as const
      }
    }
  };

  return (
    <div className={containerClass} style={{ position: 'relative' }}>
      {choices.map((choice, index) => {
        const config = choiceConfig[choice];
        const isSelected = selectedChoice === choice;
        return (
          <motion.button
            key={choice}
            custom={index}
            variants={buttonVariants}
            initial="initial"
            animate={isSelected ? "selected" : "animate"}
            whileHover={disabled ? {} : "hover"}
            whileTap={disabled ? {} : "tap"}
            className={`${buttonClass} ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
            onClick={() => !disabled && onChoice(choice)}
            disabled={disabled}
            style={{ position: 'relative' }}
          >
            <div className="icon">{config.emoji}</div>
            <div className="text">{config.label}</div>
            {cooldown && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
                pointerEvents: 'none',
                background: 'rgba(0,0,0,0.5)',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  style={{
                    width: '24px',
                    height: '24px',
                    border: '3px solid #22d3ee',
                    borderTop: '3px solid #fff',
                    borderRadius: '50%',
                  }}
                />
              </div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};

export default ChoiceButtons;
