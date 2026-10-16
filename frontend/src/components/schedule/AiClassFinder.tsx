import { useState } from 'react';
import {
    Card,
    Typography,
    Input,
    Space,
    Tag,
    Button,
    Row,
    Col,
    Spin,
    Alert,
    theme,
    Flex,
} from 'antd';
import {
    RobotOutlined,
    ThunderboltOutlined,
    BulbOutlined,
    ClockCircleOutlined,
    UserOutlined,
    CloseCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { fetchAiSuggestions, getApiErrorMessage } from '../../api/client';
import { getClassMedia } from '../../utils/classMedia';
import type { GymClass, AiSuggestionResponse } from '../../types';

interface AiClassFinderProps {
    memberId?: number;
    onBook: (gymClass: GymClass) => Promise<void>;
    onViewDetails: (gymClass: GymClass) => void;
    bookingClassId: number | null;
    isStaff: boolean;
}

const QUICK_PROMPTS = [
    '🧘 Relaxing evening stretch or yoga',
    '⚡ High intensity morning HIIT',
    '🏋️ Weekend strength & endurance',
    '🏃 Cardio conditioning',
];

export function AiClassFinder({
    memberId,
    onBook,
    onViewDetails,
    bookingClassId,
    isStaff,
}: AiClassFinderProps) {
    const { token } = theme.useToken();

    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<AiSuggestionResponse | null>(null);

    const handleSearch = async (searchQuery: string) => {
        const trimmed = searchQuery.trim();
        if (!trimmed) return;

        setLoading(true);
        setError(null);

        try {
            const data = await fetchAiSuggestions(trimmed, memberId);
            setResult(data);
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setQuery('');
        setResult(null);
        setError(null);
    };

    return (
        <Card
            style={{
                borderRadius: 16,
                marginBottom: 28,
                border: `1px solid ${token.colorBorderSecondary}`,
                background: `linear-gradient(135deg, ${token.colorBgContainer} 0%, ${token.colorFillQuaternary} 100%)`,
                boxShadow: token.boxShadowTertiary,
            }}
            bodyStyle={{ padding: '24px 28px' }}
        >
            <Flex
                justify="space-between"
                align="flex-start"
                wrap="wrap"
                gap={12}
                style={{ marginBottom: 16 }}
            >
                <div>
                    <Flex align="center" gap={8} style={{ marginBottom: 4 }}>
                        <RobotOutlined style={{ fontSize: 22, color: token.colorPrimary }} />
                        <Typography.Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                            Ask AI for a Class
                        </Typography.Title>
                        {result?.mode === 'GEMINI' && (
                            <Tag color="purple" icon={<RobotOutlined />}>
                                Gemini 3.1 Flash
                            </Tag>
                        )}
                        {result?.mode === 'FALLBACK' && (
                            <Tag color="blue" icon={<ThunderboltOutlined />}>
                                Smart Match Engine
                            </Tag>
                        )}
                    </Flex>
                    <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                        Tell us your mood, schedule, or fitness goal. We’ll find matching upcoming classes with
                        personalized reasons.
                    </Typography.Text>
                </div>

                {result && (
                    <Button
                        size="small"
                        type="text"
                        icon={<CloseCircleOutlined />}
                        onClick={handleClear}
                        style={{ color: token.colorTextTertiary }}
                    >
                        Clear Suggestions
                    </Button>
                )}
            </Flex>

            {/* Search Input Bar */}
            <Input.Search
                size="large"
                placeholder="e.g. something relaxing tomorrow evening, morning HIIT cardio, weekend workout..."
                enterButton={
                    <Button type="primary" loading={loading} icon={<RobotOutlined />}>
                        Find with AI
                    </Button>
                }
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onSearch={handleSearch}
                loading={loading}
                style={{ maxWidth: '100%', marginBottom: 14 }}
            />

            {/* Quick Prompt Pills */}
            <Flex wrap="wrap" gap={8} align="center" style={{ marginBottom: result ? 20 : 0 }}>
                <Typography.Text type="secondary" style={{ fontSize: 12, marginRight: 4 }}>
                    Try asking:
                </Typography.Text>
                {QUICK_PROMPTS.map((prompt) => (
                    <Tag
                        key={prompt}
                        style={{
                            cursor: 'pointer',
                            padding: '4px 10px',
                            borderRadius: 20,
                            fontSize: 12,
                            background: token.colorBgContainer,
                            border: `1px solid ${token.colorBorder}`,
                            transition: 'all 0.2s ease',
                        }}
                        onClick={() => {
                            setQuery(prompt);
                            handleSearch(prompt);
                        }}
                    >
                        {prompt}
                    </Tag>
                ))}
            </Flex>

            {/* Error state */}
            {error && (
                <Alert
                    type="error"
                    showIcon
                    message="Could not fetch recommendations"
                    description={error}
                    style={{ marginTop: 16 }}
                />
            )}

            {/* Loading state */}
            {loading && (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <Spin tip="Analyzing schedule and matching candidate classes..." />
                </div>
            )}

            {/* Suggestions Results */}
            {result && !loading && (
                <div style={{ marginTop: 16 }}>
                    {result.suggestions.length === 0 ? (
                        <Alert
                            type="info"
                            showIcon
                            message="No exact matching classes found"
                            description="Try asking for different keywords like 'yoga', 'HIIT', 'morning', or 'weekend' to match available classes."
                        />
                    ) : (
                        <div>
                            <Typography.Text
                                strong
                                style={{
                                    display: 'block',
                                    marginBottom: 12,
                                    fontSize: 14,
                                    color: token.colorTextSecondary,
                                }}
                            >
                                Top Recommendations for "{result.query}":
                            </Typography.Text>

                            <Row gutter={[16, 16]}>
                                {result.suggestions.map(({ classId, gymClass, reason }) => {
                                    const media = getClassMedia(gymClass.title);
                                    const isBookingThis = bookingClassId === classId;

                                    return (
                                        <Col xs={24} md={12} lg={8} key={classId}>
                                            <Card
                                                size="small"
                                                hoverable
                                                style={{
                                                    borderRadius: 12,
                                                    height: '100%',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'space-between',
                                                    border: `1px solid ${token.colorBorderSecondary}`,
                                                }}
                                                cover={
                                                    <div style={{ position: 'relative', height: 110, overflow: 'hidden' }}>
                                                        <img
                                                            alt={gymClass.title}
                                                            src={media.imageUrl}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                        <Tag
                                                            color="geekblue"
                                                            style={{
                                                                position: 'absolute',
                                                                top: 8,
                                                                left: 8,
                                                                margin: 0,
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            {media.category}
                                                        </Tag>
                                                    </div>
                                                }
                                            >
                                                {/* Personalized Recommendation Reason */}
                                                <div
                                                    style={{
                                                        background: token.colorFillAlter,
                                                        borderLeft: `3px solid ${token.colorPrimary}`,
                                                        padding: '8px 10px',
                                                        borderRadius: '0 6px 6px 0',
                                                        marginBottom: 10,
                                                    }}
                                                >
                                                    <Typography.Text
                                                        style={{
                                                            fontSize: 12,
                                                            color: token.colorText,
                                                            lineHeight: 1.4,
                                                            display: 'block',
                                                        }}
                                                    >
                                                        <BulbOutlined style={{ color: token.colorPrimary, marginRight: 6 }} />
                                                        {reason}
                                                    </Typography.Text>
                                                </div>

                                                {/* Class Info */}
                                                <Typography.Title level={5} style={{ margin: '0 0 4px', fontSize: 15 }}>
                                                    {gymClass.title}
                                                </Typography.Title>
                                                <Typography.Text
                                                    type="secondary"
                                                    style={{ fontSize: 12, display: 'block', marginBottom: 8 }}
                                                >
                                                    Coach: <strong>{gymClass.coach}</strong>
                                                </Typography.Text>

                                                <Space
                                                    orientation="vertical"
                                                    size={4}
                                                    style={{ width: '100%', marginBottom: 12 }}
                                                >
                                                    <Space size={6} style={{ fontSize: 12, color: token.colorTextSecondary }}>
                                                        <ClockCircleOutlined />
                                                        <span>
                                                            {dayjs(gymClass.startsAt).format('ddd, MMM D · h:mm A')} (
                                                            {gymClass.durationMinutes}m)
                                                        </span>
                                                    </Space>
                                                    <Space size={6} style={{ fontSize: 12, color: token.colorTextSecondary }}>
                                                        <UserOutlined />
                                                        <span>
                                                            {gymClass.isFull
                                                                ? `Full (${gymClass.waitlistCount} on waitlist)`
                                                                : `${gymClass.seatsLeft} of ${gymClass.capacity} seats left`}
                                                        </span>
                                                    </Space>
                                                </Space>

                                                {/* Action Buttons */}
                                                <Flex gap={8} style={{ marginTop: 'auto' }}>
                                                    <Button
                                                        type="default"
                                                        size="small"
                                                        onClick={() => onViewDetails(gymClass)}
                                                        style={{ flex: 1 }}
                                                    >
                                                        Details
                                                    </Button>
                                                    <Button
                                                        type={gymClass.isFull ? 'default' : 'primary'}
                                                        size="small"
                                                        loading={isBookingThis}
                                                        disabled={isStaff}
                                                        onClick={() => onBook(gymClass)}
                                                        style={{ flex: 1.4 }}
                                                    >
                                                        {gymClass.isFull ? 'Join Waitlist' : 'Book Spot'}
                                                    </Button>
                                                </Flex>
                                            </Card>
                                        </Col>
                                    );
                                })}
                            </Row>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
}
