"use client";

import { Fragment, memo } from "react";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export type Crumb = { label: string; href?: string };

export const PageBreadcrumbs = memo(function PageBreadcrumbs({ items }: { items: Crumb[] }) {
  const showEllipsis = items.length > 3;

  function renderCrumb(item: Crumb) {
    return item.href ? (
      <BreadcrumbLink render={<Link href={item.href} />}>
        {item.label}
      </BreadcrumbLink>
    ) : (
      <BreadcrumbPage>{item.label}</BreadcrumbPage>
    );
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {showEllipsis ? (
          <>
            <BreadcrumbItem>{renderCrumb(items[0])}</BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbEllipsis />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            {items.slice(-2).map((item, i) => (
              <Fragment key={`${item.label}-${i}`}>
                <BreadcrumbItem>{renderCrumb(item)}</BreadcrumbItem>
                {i === 0 && <BreadcrumbSeparator />}
              </Fragment>
            ))}
          </>
        ) : (
          items.map((item, i) => (
            <Fragment key={`${item.label}-${i}`}>
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>{renderCrumb(item)}</BreadcrumbItem>
            </Fragment>
          ))
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
});
