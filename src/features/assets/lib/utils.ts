export function createPageUrl(pageName: string): string {
  switch (pageName) {
    case 'Assets':
      return '/assets';
    case 'TechnicianPortal':
    case 'Tickets':
      return '/tickets';
    default:
      return '/';
  }
}


