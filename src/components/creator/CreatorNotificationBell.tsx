import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  Bell, 
  MessageCircle, 
  Coins, 
  UserPlus, 
  Heart,
  Check,
  Trash2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useCreatorNotifications, CreatorNotification } from '@/hooks/useCreatorNotifications';

interface CreatorNotificationBellProps {
  creatorId: string | undefined;
}

const getNotificationIcon = (type: CreatorNotification['type']) => {
  switch (type) {
    case 'paid_message':
      return <MessageCircle className="w-4 h-4 text-[#FF6600]" />;
    case 'content_request':
      return <Coins className="w-4 h-4 text-purple-500" />;
    case 'new_subscriber':
      return <UserPlus className="w-4 h-4 text-green-500" />;
    case 'tip':
      return <Heart className="w-4 h-4 text-pink-500" />;
    default:
      return <Bell className="w-4 h-4" />;
  }
};

export const CreatorNotificationBell = ({ creatorId }: CreatorNotificationBellProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useCreatorNotifications(creatorId);

  // Listen for real-time notification events within the same tab
  useEffect(() => {
    const handleNewNotification = (e: CustomEvent) => {
      if (e.detail.creatorId === creatorId) {
        // Add the new notification to state directly
        const newNotif = e.detail.notification;
        // We need to re-fetch from localStorage since the hook manages its own state
        const stored = localStorage.getItem(`creator_notifications_${creatorId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Force component update by closing and reopening if needed
          // The useCreatorNotifications hook will pick up changes on next render
        }
      }
    };

    window.addEventListener('creator-notification', handleNewNotification as EventListener);
    return () => {
      window.removeEventListener('creator-notification', handleNewNotification as EventListener);
    };
  }, [creatorId]);

  const handleNotificationClick = (notification: CreatorNotification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  if (!creatorId) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-[#FF6600] text-white text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {notifications.length > 0 && (
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={markAllAsRead}
                >
                  <Check className="w-3 h-3 mr-1" />
                  Mark all read
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Notifications list */}
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 hover:bg-muted/50 transition-colors cursor-pointer ${
                    !notification.read ? 'bg-[#FF6600]/5' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${!notification.read ? 'font-medium' : ''}`}>
                          {notification.title}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-[#FF6600] shrink-0 mt-1.5" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground hover:text-destructive"
              onClick={clearAll}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
