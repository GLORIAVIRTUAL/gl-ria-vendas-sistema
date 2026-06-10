import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { Link } from 'react-router-dom';
import { createPageUrl } from "@/utils";

const pipelineStages = [
  { id: 'novo_lead', title: 'Novos Leads', color: 'from-blue-500 to-blue-600' },
  { id: 'qualificado', title: 'Qualificados', color: 'from-cyan-500 to-cyan-600' },
  { id: 'proposta', title: 'Proposta', color: 'from-yellow-500 to-yellow-600' },
  { id: 'negociacao', title: 'Negociação', color: 'from-orange-500 to-orange-600' },
  { id: 'fechado_ganho', title: 'Fechados (Ganho)', color: 'from-green-500 to-green-600' },
  { id: 'fechado_perdido', title: 'Fechados (Perdido)', color: 'from-gray-500 to-gray-600' },
];

export default function PipelineBoard({ contacts, onDragEnd, onSelectContact }) {
  const getContactsByStage = (stageId) => {
    return contacts.filter(c => (c.pipeline_stage || 'novo_lead') === stageId);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-200px)]">
        {pipelineStages.map((stage) => (
          <div 
            key={stage.id} 
            className="flex-shrink-0 w-72 bg-slate-50 rounded-2xl overflow-hidden"
          >
            <div className={cn(
              "p-4 bg-gradient-to-r text-white",
              stage.color
            )}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{stage.title}</h3>
                <Badge variant="secondary" className="bg-white/20 text-white border-none">
                  {getContactsByStage(stage.id).length}
                </Badge>
              </div>
            </div>

            <Droppable droppableId={stage.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "p-3 min-h-[400px] space-y-3 transition-colors",
                    snapshot.isDraggingOver && "bg-blue-50"
                  )}
                >
                  {getContactsByStage(stage.id).map((contact, index) => (
                    <Draggable 
                      key={contact.id} 
                      draggableId={contact.id} 
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          onClick={() => onSelectContact(contact)}
                          className={cn(
                            "bg-white rounded-xl p-4 shadow-sm border border-slate-100 cursor-pointer",
                            "hover:shadow-md transition-all",
                            snapshot.isDragging && "shadow-lg ring-2 ring-blue-500"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10 border-2 border-slate-100">
                              <AvatarImage src={contact.profile_picture} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-sm">
                                {(contact.name || contact.phone || '?').charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-slate-800 truncate">
                                {contact.name || 'Sem nome'}
                              </h4>
                              <p className="text-xs text-slate-500 truncate">{contact.phone}</p>
                            </div>
                            <Link
                              to={`${createPageUrl("ChatIA")}?contact=${contact.id}`}
                              onClick={(e) => e.stopPropagation()}
                              title="Abrir conversa"
                              className="flex-shrink-0 p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </Link>
                          </div>

                          {contact.keywords?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {contact.keywords.slice(0, 3).map((kw, i) => (
                                <Badge 
                                  key={i} 
                                  variant="secondary" 
                                  className="text-[10px] bg-blue-50 text-blue-600 border-none"
                                >
                                  {kw}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {contact.last_message_at && (
                            <div className="flex items-center gap-1 mt-3 text-xs text-slate-400">
                              <Clock className="w-3 h-3" />
                              <span>
                                {format(new Date(contact.last_message_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}