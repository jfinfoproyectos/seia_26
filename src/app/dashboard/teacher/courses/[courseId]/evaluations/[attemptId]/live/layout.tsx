import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Panel en Vivo | SmartClass',
    description: 'Panel de clasificación en vivo',
};

export default function LiveLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="fixed inset-0 z-[100] bg-background">
            {children}
        </div>
    );
}
