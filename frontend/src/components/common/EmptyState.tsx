import { Empty, Button, Flex } from 'antd';
import type { ReactNode } from 'react';

interface EmptyStateProps {
    title?: string;
    description?: ReactNode;
    actionLabel?: string;
    onAction?: () => void;
    minHeight?: number | string;
}

export function EmptyState({
    title,
    description = 'No data available',
    actionLabel,
    onAction,
    minHeight = 240,
}: EmptyStateProps) {
    return (
        <Flex align="center" justify="center" style={{ minHeight, width: '100%' }}>
            <Empty description={description}>
                {title && <div style={{ fontWeight: 600, marginBottom: 8 }}>{title}</div>}
                {actionLabel && onAction && (
                    <Button type="primary" onClick={onAction}>
                        {actionLabel}
                    </Button>
                )}
            </Empty>
        </Flex>
    );
}
