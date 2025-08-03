'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Sparkles, ExternalLink, Zap } from 'lucide-react';
import { Button } from '../ui/basic/button';
import { Card } from '../ui/basic/card';
import { CJMessage, EMOTION_COLORS } from './types';

interface CJChatBubbleProps {
  user: any;
  messages: CJMessage[];
  onActionClick?: (action: string, params?: any) => void;
  onVisitSite?: () => void;
}

export function CJChatBubble({ user, messages, onActionClick, onVisitSite }: CJChatBubbleProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);

  const currentMessage = messages[currentMessageIndex];

  useEffect(() => {
    if (messages.length > 1) {
      const interval = setInterval(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
        setShowNewMessage(true);
        setTimeout(() => setShowNewMessage(false), 2000);
      }, 8000);

      return () => clearInterval(interval);
    }
  }, [messages.length]);

  if (!currentMessage) return null;

  const getEmotionIcon = (emotion: string) => {
    switch (emotion) {
      case 'excited': return '🎉';
      case 'encouraging': return '💪';
      case 'congratulatory': return '🏆';
      case 'urgent': return '⚡';
      default: return '😊';
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="relative"
          >
            <Button
              onClick={() => setIsExpanded(true)}
              className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 shadow-elegant border-2 border-primary/50"
            >
              <div className="relative">
                <MessageCircle className="w-6 h-6 text-white" />
                
                {/* New message indicator */}
                <AnimatePresence>
                  {showNewMessage && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white"
                    />
                  )}
                </AnimatePresence>
              </div>
            </Button>

            {/* Floating animation */}
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
            >
              <Sparkles className="absolute -top-1 -left-1 w-4 h-4 text-yellow-400 opacity-70" />
            </motion.div>
          </motion.div>
        )}

        {isExpanded && (
          <motion.div
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 20 }}
            className="mb-4"
          >
            <Card className="w-80 p-4 bg-card border-elegant shadow-elegant">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                  <span className="text-lg">{getEmotionIcon(currentMessage.emotion)}</span>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-primary game-subtitle">CJ AI</span>
                    <span className={`text-xs ${EMOTION_COLORS[currentMessage.emotion]}`}>
                      {currentMessage.emotion}
                    </span>
                  </div>
                  <p className="text-sm text-white leading-relaxed">
                    {currentMessage.message}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-white"
                >
                  ×
                </Button>
              </div>

              {/* Action buttons */}
              {currentMessage.actionSuggestion && (
                <div className="space-y-2">
                  <Button
                    onClick={() => onActionClick?.(currentMessage.actionSuggestion!.action, currentMessage.actionSuggestion!.params)}
                    className="w-full h-9 bg-primary hover:bg-primary/90 text-white text-sm"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    {currentMessage.actionSuggestion.text}
                  </Button>
                  
                  <Button
                    onClick={onVisitSite}
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs text-primary border-primary/30 hover:bg-primary/10"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    본사 사이트 방문하여 더 많은 토큰 받기
                  </Button>
                </div>
              )}

              {/* Message navigation */}
              {messages.length > 1 && (
                <div className="flex justify-center mt-3 gap-1">
                  {messages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentMessageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentMessageIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                      }`}
                    />
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
