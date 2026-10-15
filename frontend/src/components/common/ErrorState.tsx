import { Result, Button, Flex } from 'antd';

interface ErrorStateProps {
    title?: string;
    message?: string;
    onRetry?: () => void;
    minHeight?: number | string;
}

export function ErrorState({
    title = 'Something went wrong',
    message = 'Failed to load content. Please try again.',
    onRetry,
    minHeight = 240,
}: ErrorStateProps) {
    return (
        <Flex align="center" justify="center" style={{ minHeight, width: '100%' }}>
            <Result
                status="warning"
                title={title}
                subTitle={message}
                extra={
                    onRetry ? (
                        <Button type="primary" onClick={onRetry}>
                            Try Again
                        </Button>
                    ) : undefined
                }
            />
        </Flex>
    );
}
