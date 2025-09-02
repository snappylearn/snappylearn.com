import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AIBadge } from "@/components/ui/ai-badge";
import { UserPlus, UserCheck } from "lucide-react";

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  userTypeId?: number;
  about?: string | null;
  createdBy?: string | null;
  followerCount?: number;
  postCount?: number;
  isFollowing?: boolean;
  bio?: string;
}

interface UserCardProps {
  user: User;
  onFollow?: (userId: string) => void;
  onUnfollow?: (userId: string) => void;
  creatorName?: string; // Name of the user who created this assistant
  variant?: "vertical" | "horizontal";
}

export function UserCard({ user, onFollow, onUnfollow, creatorName, variant = "vertical" }: UserCardProps) {
  const isAI = user.userTypeId === 2;
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const initials = [user.firstName, user.lastName]
    .filter(Boolean)
    .map(name => name?.[0])
    .join("")
    .toUpperCase();

  const handleFollowToggle = () => {
    if (user.isFollowing) {
      onUnfollow?.(user.id);
    } else {
      onFollow?.(user.id);
    }
  };

  if (variant === "horizontal") {
    return (
      <Card className="p-4">
        <CardContent className="p-0">
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16 flex-shrink-0">
              <AvatarImage src={user.profileImageUrl || undefined} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg truncate">{displayName}</h3>
                {isAI && <AIBadge size="sm" />}
              </div>
              
              {isAI && creatorName && (
                <p className="text-sm text-gray-500 mb-2">by {creatorName}</p>
              )}
              
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {user.about || user.bio || "No bio available"}
              </p>
              
              {(user.followerCount !== undefined || user.postCount !== undefined) && (
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  {user.followerCount !== undefined && (
                    <span>{user.followerCount} followers</span>
                  )}
                  {user.postCount !== undefined && (
                    <span>{user.postCount} posts</span>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex-shrink-0">
              <Button
                variant={user.isFollowing ? "outline" : "default"}
                size="sm"
                onClick={handleFollowToggle}
                className="min-w-[100px]"
              >
                {user.isFollowing ? (
                  <>
                    <UserCheck className="w-4 h-4 mr-2" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Follow
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Vertical layout (default)
  return (
    <Card className="p-4">
      <CardContent className="p-0">
        <div className="flex items-start space-x-3">
          <Avatar className="w-12 h-12">
            <AvatarImage src={user.profileImageUrl || undefined} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm truncate">{displayName}</h3>
              {isAI && <AIBadge size="sm" />}
            </div>
            
            {isAI && creatorName && (
              <p className="text-xs text-gray-500 mb-2">by {creatorName}</p>
            )}
            
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {user.about || user.bio || "No bio available"}
            </p>
            
            {(user.followerCount !== undefined || user.postCount !== undefined) && (
              <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                {user.followerCount !== undefined && (
                  <span>{user.followerCount} followers</span>
                )}
                {user.postCount !== undefined && (
                  <span>{user.postCount} posts</span>
                )}
              </div>
            )}
            
            <Button
              variant={user.isFollowing ? "outline" : "default"}
              size="sm"
              onClick={handleFollowToggle}
              className="w-full"
            >
              {user.isFollowing ? (
                <>
                  <UserCheck className="w-4 h-4 mr-2" />
                  Following
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Follow
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}