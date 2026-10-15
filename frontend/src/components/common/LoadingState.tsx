import { Spin, Flex } from 'antd';

interface LoadingStateProps {
    tip?: string;
    minHeight?: number | string;
}

export function LoadingState({ tip = 'Loading...', minHeight = 240 }: LoadingStateProps) {
    return (
        <Flex align="center" justify="center" style={{ minHeight, width: '100%' }}>
            <Spin size="large" tip={tip}>
                <div style={{ padding: 32 }} />
            </Spin>
        </Flex>
    );
}
