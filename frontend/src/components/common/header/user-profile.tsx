"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import {
  LogoutIcon,
  UserCircleIcon,
} from "@/components/common/header/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/tailgrids/core/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuHeader,
  DropdownMenuItem,
  DropdownMenuSection,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/tailgrids/core/dropdown";
import { AltArrowDownIcon } from "@/utils/icon";
import Link from "next/link";

interface UserProfile {
  name: string;
  role: string;
}

export function UserProfileButton() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    try {
      const userInfoStr = Cookies.get("user_info");
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr);
        setUser({
          name: userInfo.fullName || userInfo.username || userInfo.FullName || userInfo.Username || "Người dùng",
          role: userInfo.role || userInfo.Role || "Nhân viên",
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleLogout = () => {
    Cookies.remove("jwt_token");
    Cookies.remove("user_info");
    router.push("/login");
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="group flex items-center gap-2.5 rounded-lg border-0 p-0 transition-all outline-none focus-visible:ring-4 focus-visible:ring-input-primary-focus-border/20 focus-visible:ring-offset-1">
        <Avatar>
          <AvatarFallback className="rounded-lg border border-border-secondary-alt bg-blue-100 text-blue-600 font-bold">
            {user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <span className="text-sm leading-5 font-medium text-text-primary">{user.name}</span>

        <AltArrowDownIcon className="text-icon-tertiary transition-transform duration-200 group-aria-expanded:-rotate-180" />
      </DropdownMenuTrigger>

      <DropdownMenuContent placement="bottom end" className="w-70 overflow-hidden p-0 shadow-3xl bg-white">
        <DropdownMenuHeader className="flex w-full items-center justify-start gap-2 border-b border-border-secondary-alt px-4 py-3">
          <Avatar size="md">
            <AvatarFallback className="border border-border-secondary-alt bg-blue-100 text-blue-600 font-bold">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="flex flex-col">
            <span className="text-sm font-medium text-text-primary">{user.name}</span>
            <span className="truncate text-xs text-gray-500">Vai trò: {user.role}</span>
          </span>
        </DropdownMenuHeader>

        <DropdownMenuSection className="p-1.5">
          <DropdownMenuItem
            href="#"
            className="cursor-pointer px-3 py-2.5 hover:bg-gray-50"
            render={(domProps) =>
              "href" in domProps ? <Link {...domProps} /> : <div {...domProps} />
            }
          >
            <span className="shrink-0 text-icon-secondary group-hover:text-text-primary">
              <UserCircleIcon />
            </span>
            <span className="leading-5 font-medium text-gray-800">Thông tin cá nhân</span>
          </DropdownMenuItem>
        </DropdownMenuSection>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onAction={handleLogout}
          className="m-1.5 w-auto cursor-pointer px-3 py-2.5 hover:bg-red-50 text-red-600"
        >
          <span className="group-hover:text-red-700">
            <LogoutIcon />
          </span>
          <span className="leading-5 font-medium">Đăng xuất</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
