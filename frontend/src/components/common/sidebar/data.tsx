import {
  AlphabetIcon,
  HomeIcon,
  PieChartIcon,
  TableIcon,
  UserIcon,
  Widget4Icon,
  WindowIcon
} from "./icon";

import React from 'react';

export interface NavItemType {
  title: string;
  url: string;
  icon: React.ReactNode;
  items: NavItemType[];
  requiredRoles?: string[];
}

export const NAV_DATA = [
  {
    label: "MAIN MENU",
    items: [
      {
        title: "Trang Chủ",
        url: "/",
        icon: <HomeIcon />,
        items: [],
      },
      {
        title: "Tìm kiếm",
        url: "/search",
        icon: <AlphabetIcon />,
        items: [],
      },
      {
        title: "Quản lý Tài liệu",
        url: "/documents",
        icon: <TableIcon />,
        items: [],
        requiredRoles: ["Editor", "Reviewer", "ContentAdmin", "SystemAdmin"],
      },
      {
        title: "Quản lý Danh mục",
        url: "/categories",
        icon: <Widget4Icon />,
        items: [],
        requiredRoles: ["ContentAdmin", "SystemAdmin"],
      },
      {
        title: "Quản lý Người dùng",
        url: "/users",
        icon: <UserIcon />,
        items: [],
        requiredRoles: ["SystemAdmin"],
      }
    ] as NavItemType[],
  }
];
