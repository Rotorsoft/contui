import { useInput } from "ink";
import { useCallback } from "react";
import type { Tab } from "../types/index.js";

interface UseKeyboardOptions {
  onQuit: () => void;
  onTabChange: (tab: Tab) => void;
  onNavigate: (direction: "up" | "down") => void;
  onSelect: () => void;
  onBack: () => void;
  onSearch: () => void;
  onHelp: () => void;
  onRefresh: () => void;
  onAction: (action: string) => void;
  isSearchMode: boolean;
  isDetailView: boolean;
  isDialogOpen: boolean;
  activeTab: Tab;
}

const TAB_KEYS: Record<string, Tab> = {
  "1": "containers",
  "2": "images",
  "3": "networks",
  "4": "volumes",
};

const TAB_ORDER: Tab[] = ["containers", "images", "networks", "volumes"];

export function useKeyboard(options: UseKeyboardOptions): void {
  const {
    onQuit,
    onTabChange,
    onNavigate,
    onSelect,
    onBack,
    onSearch,
    onHelp,
    onRefresh,
    onAction,
    isSearchMode,
    isDetailView,
    isDialogOpen,
    activeTab,
  } = options;

  const handleInput = useCallback(
    (input: string, key: { escape?: boolean; return?: boolean; upArrow?: boolean; downArrow?: boolean; tab?: boolean }) => {
      if (isSearchMode || isDialogOpen) {
        if (key.escape) {
          onBack();
        }
        return;
      }

      if (isDetailView) {
        if (key.escape || input === "q") {
          onBack();
        }
        return;
      }

      if (input === "q") {
        onQuit();
        return;
      }

      if (key.escape) {
        onBack();
        return;
      }

      const tab = TAB_KEYS[input];
      if (tab) {
        onTabChange(tab);
        return;
      }

      if (input === "j" || key.downArrow) {
        onNavigate("down");
        return;
      }

      if (input === "k" || key.upArrow) {
        onNavigate("up");
        return;
      }

      if (key.return) {
        onSelect();
        return;
      }

      if (input === "/") {
        onSearch();
        return;
      }

      if (input === "?") {
        onHelp();
        return;
      }

      if (input === "r") {
        onRefresh();
        return;
      }

      if (input === "s") {
        onAction("start");
        return;
      }

      if (input === "x") {
        onAction("stop");
        return;
      }

      if (input === "R") {
        onAction("restart");
        return;
      }

      if (input === "d") {
        onAction("delete");
        return;
      }

      if (input === "L") {
        onAction("logs");
        return;
      }

      if (input === "h") {
        const currentIndex = TAB_ORDER.indexOf(activeTab);
        const newIndex = currentIndex > 0 ? currentIndex - 1 : TAB_ORDER.length - 1;
        onTabChange(TAB_ORDER[newIndex] as Tab);
        return;
      }

      if (input === "l") {
        const currentIndex = TAB_ORDER.indexOf(activeTab);
        const newIndex = currentIndex < TAB_ORDER.length - 1 ? currentIndex + 1 : 0;
        onTabChange(TAB_ORDER[newIndex] as Tab);
        return;
      }

      if (input === "i") {
        onAction("inspect");
        return;
      }

      if (input === "p") {
        onAction("pull");
        return;
      }

      if (input === "c") {
        onAction("create");
        return;
      }

      if (input === "n") {
        onAction("run");
        return;
      }

      if (input === "e") {
        onAction("edit");
        return;
      }
    },
    [
      isSearchMode,
      isDetailView,
      isDialogOpen,
      activeTab,
      onQuit,
      onBack,
      onTabChange,
      onNavigate,
      onSelect,
      onSearch,
      onHelp,
      onRefresh,
      onAction,
    ]
  );

  useInput(handleInput);
}
