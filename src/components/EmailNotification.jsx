import React, { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Mail, X, ExternalLink, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function EmailNotification() {
  const [emails, setEmails] = useState([]);
  const [dismissed, setDismissed] = useState(new Set());

  // Esta função será chamada pelo Google Apps Script via webhook
  // Os emails chegarão automaticamente aqui

  const visibleEmails = emails.filter(email => 
    !dismissed.has(email.subject + email.from)
  );

  const handleDismiss = (email) => {
    setDismissed(prev => new Set([...prev, email.subject + email.from]));
  };

  const openGmail = () => {
    window.open('https://mail.google.com', '_blank');
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md space-y-3">
      {/* Indicador de status */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Alert className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700 font-medium">
              Monitoramento automático ativo
            </span>
          </div>
          <p className="text-xs text-green-600 mt-1">
            Via Google Apps Script
          </p>
        </Alert>
      </motion.div>
      
      <AnimatePresence>
        {visibleEmails.slice(0, 3).map((email, index) => (
          <motion.div
            key={email.subject + email.from + index}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <Alert className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300 shadow-2xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <Mail className="w-5 h-5 text-blue-600 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <AlertTitle className="text-slate-900 font-bold mb-1 pr-6">
                    📧 Novo Email!
                  </AlertTitle>
                  <AlertDescription className="space-y-1">
                    <p className="text-sm font-semibold text-blue-900 truncate">
                      {email.subject || 'Sem assunto'}
                    </p>
                    <p className="text-xs text-slate-600 truncate">
                      De: {email.from}
                    </p>
                    {email.text && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {email.text}
                      </p>
                    )}
                  </AlertDescription>
                  <Button
                    onClick={openGmail}
                    size="sm"
                    className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir Gmail
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDismiss(email)}
                  className="absolute top-2 right-2 h-6 w-6 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Alert>
          </motion.div>
        ))}
      </AnimatePresence>
      
      {visibleEmails.length > 3 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert className="bg-slate-100 border-slate-300 text-center">
            <p className="text-sm text-slate-700">
              + {visibleEmails.length - 3} email{visibleEmails.length - 3 > 1 ? 's' : ''} não lido{visibleEmails.length - 3 > 1 ? 's' : ''}
            </p>
            <Button
              onClick={openGmail}
              size="sm"
              variant="outline"
              className="mt-2 w-full"
            >
              Ver todos no Gmail
            </Button>
          </Alert>
        </motion.div>
      )}
    </div>
  );
}