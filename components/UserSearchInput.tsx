import React, { useEffect, useState } from 'react';
import Input from '@/components/elements/Input';
import { searchUsers, UserMatch } from './api/getFilteredServers';

interface Props {
    onSelect: (id: number) => void;
}

export default ({ onSelect }: Props) => {
    const [query, setQuery] = useState('');
    const [matches, setMatches] = useState<UserMatch[]>([]);

    useEffect(() => {
        if (query.length < 2) {
            setMatches([]);
            return;
        }

        const timeout = setTimeout(() => {
            searchUsers(query).then(setMatches);
        }, 300);

        return () => clearTimeout(timeout);
    }, [query]);

    return (
        <div className={'relative flex-1 min-w-[16rem]'}>
            <Input
                className={'w-full'}
                placeholder={'Search by username or email'}
                value={query}
                onChange={(e) => setQuery(e.currentTarget.value)}
            />
            {matches.length > 0 && (
                <ul className={'absolute z-50 w-full bg-neutral-700 border border-neutral-500 rounded mt-1'}>
                    {matches.map((match) => (
                        <li
                            key={match.id}
                            className={'px-3 py-2 text-sm text-neutral-200 cursor-pointer hover:bg-neutral-600'}
                            onClick={() => {
                                onSelect(match.id);
                                setMatches([]);
                                setQuery(match.username);
                            }}
                        >
                            {match.username} ({match.email})
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
