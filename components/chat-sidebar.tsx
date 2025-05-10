import type * as React from "react"
import Image from "next/image"

import { SearchForm } from "./search-form"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

// Sample chat history data
const data = {
  chatHistory: [
    {
      title: "Today",
      items: [
        {
          title: "AI Image Generation",
          preview: "Can you generate an image of a sunset?",
          isActive: true,
        },
        {
          title: "Chatbot Development",
          preview: "How do I create a chatbot using Python?",
          isActive: false,
        },
        {
          title: "UI Design Principles",
          preview: "What are the key principles of UI design?",
          isActive: false,
        },
        {
          title: "Machine Learning Basics",
          preview: "Can you explain supervised vs unsupervised learning?",
          isActive: false,
        },
        {
          title: "Cloud Computing",
          preview: "What are the benefits of using cloud services?",
          isActive: false,
        },
        {
          title: "Data Visualization",
          preview: "How can I create effective data visualizations?",
          isActive: false,
        },
        {
          title: "Cybersecurity Essentials",
          preview: "What are the best practices for securing data?",
          isActive: false,
        },
        {
          title: "Responsive Web Design",
          preview: "How do I make my website responsive?",
          isActive: false,
        },
        {
          title: "JavaScript Frameworks",
          preview: "Which JavaScript framework should I use?",
          isActive: false,
        },
        {
          title: "DevOps Practices",
          preview: "What are the key components of a DevOps strategy?",
          isActive: false,
        },
        {
          title: "Code Review",
          preview: "Could you review my React component?",
        },
      ],
    },
    {
      title: "Yesterday",
      items: [
        {
          title: "Next.js Routing",
          preview: "How do I set up dynamic routes in Next.js?",
        },
        {
          title: "Database Schema",
          preview: "What's the best schema for a chat application?",
        },
        {
          title: "Tailwind Configuration",
          preview: "How do I customize colors in Tailwind?",
        },
      ],
    },
    {
      title: "Previous 7 Days",
      items: [
        {
          title: "API Integration",
          preview: "What's the best way to handle API errors?",
        },
        {
          title: "Authentication",
          preview: "How do I implement OAuth with Next.js?",
        },
        {
          title: "Performance Optimization",
          preview: "My React app is slow. How can I optimize it?",
        },
        {
          title: "Deployment Options",
          preview: "What are the best options for deploying a Next.js app?",
        },
      ],
    },
    {
      title: "Older",
      items: [
        {
          title: "State Management",
          preview: "Should I use Redux or Context API?",
        },
        {
          title: "CSS Frameworks",
          preview: "What CSS framework would you recommend?",
        },
        {
          title: "Testing Strategies",
          preview: "How should I test my React components?",
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <>
      {/* Fixed header that's always visible */}
      <div className="fixed top-4 left-4 z-50 flex items-center gap-2">
        <div className="relative w-10 h-10">
          <Image 
            src="/logo.svg" 
            alt="Seemless Chat Logo" 
            fill
            className="object-contain"
            style={{ filter: "invert(45%) sepia(80%) saturate(1000%) hue-rotate(200deg) brightness(90%) contrast(90%)" }}
          />
        </div>
        <span className="font-semibold text-base">Seemless Chat</span>
        <SidebarTrigger className="h-10 w-10" />
      </div>

      <Sidebar collapsible="offcanvas" {...props}>
        <SidebarHeader className="pt-16">
          <div className="px-2 py-2">
            <Button variant="default" className="w-full flex items-center justify-center gap-2">
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
          </div>
          <SearchForm placeholder="Search chat history..." />
        </SidebarHeader>
        <SidebarContent>
          {data.chatHistory.map((group) => (
            <SidebarGroup key={group.title}>
              <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((chat) => (
                    <SidebarMenuItem key={chat.title}>
                      <SidebarMenuButton asChild isActive={chat.isActive} className="flex flex-col items-start">
                        <a href="#" className="w-full">
                          <div className="w-full">
                            <span className="font-medium">{chat.title}</span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{chat.preview}</p>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
    </>
  )
}
