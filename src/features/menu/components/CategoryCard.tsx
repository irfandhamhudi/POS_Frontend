import React from 'react';
import type { Category } from '../types';
import { cn } from 'src/lib/utils';
import coffeeIcon from '../../../assets/Coffee.svg';
import teaIcon from '../../../assets/Tea.svg';
import snackIcon from '../../../assets/Snack.svg';
import mainCourseIcon from '../../../assets/Main Course.svg';
import { useTranslation } from '../../../hooks/useTranslation';

interface CategoryCardProps {
  category: Category;
  isSelected: boolean;
  onClick: () => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  isSelected,
  onClick,
}) => {
  const { t } = useTranslation();
  const getCategoryOverlayIcon = () => {
    switch (category.id) {
      case 'coffee':
        return coffeeIcon;
      case 'tea':
        return teaIcon;
      case 'snack':
        return snackIcon;
      case 'main_course':
        return mainCourseIcon;
      default:
        return coffeeIcon;
    }
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative flex flex-col justify-between flex-1 min-w-50 h-36.25 p-5 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden select-none active:scale-[0.98]",
        isSelected
          ? "bg-[#0A422D] text-white border-transparent shadow-[0_12px_24px_-10px_rgba(10,66,45,0.45)] scale-[1.02] -translate-y-0.5"
          : "bg-white border-[#EBEAE4] text-gray-900 hover:border-[#0A422D]/40 hover:shadow-[0_8px_16px_-6px_rgba(0,0,0,0.04)] hover:-translate-y-0.5"
      )}
    >
      {/* Decorative Vector Overlay inside selected card */}
      {isSelected && (
        <img
          src={getCategoryOverlayIcon()}
          alt="pattern"
          className="absolute -right-3 -bottom-3 w-28 h-28 opacity-10 pointer-events-none invert"
        />
      )}

      {/* Top row: Availability Badge & Category Icon */}
      <div className="flex items-center justify-between">
        {category.needRestock ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#FEF2F2] text-[#DC2626] border border-[#FEE2E2]">
            {t('pos.restockNeeded', 'Restock Needed')}
          </span>
        ) : (
          <span
            className={cn(
              "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold border",
              isSelected
                ? "bg-white/10 text-white border-white/20"
                : "bg-gray-50 text-gray-700 border-gray-150"
            )}
          >
            {t('pos.activeMenu', 'Active Menu')}
          </span>
        )}

        {/* Small Beautiful Icon Box */}
        <div className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-2xs border",
          isSelected
            ? "bg-white/15 border-white/10"
            : "bg-[#FAF9F5] border-[#EBEAE4]"
        )}>
          <img
            src={getCategoryOverlayIcon()}
            alt={category.name}
            className={cn(
              "w-5 h-5 object-contain transition-all duration-300",
              isSelected ? "invert brightness-200" : "dark:invert opacity-85"
            )}
          />
        </div>
      </div>

      {/* Bottom row: Name & Item count */}
      <div className="flex flex-col text-left">
        <span className={cn("text-[17px] font-black leading-tight tracking-tight", isSelected ? "text-white" : "text-gray-900")}>
          {t(`menuManagement.categories.${category.id}`, category.name)}
        </span>
        <span className={cn("text-xs font-bold mt-1", isSelected ? "text-emerald-200/80" : "text-gray-400")}>
          {t('pos.itemsCount', { count: category.itemCount })}
        </span>
      </div>
    </div>
  );
};
