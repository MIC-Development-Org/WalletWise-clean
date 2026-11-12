import { useRef, useState, type FormEvent } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { Field, primaryAction } from '@/components/kit';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Panel } from '@/components/ui/panel';
import { PhotoError, photoFromFile } from '@/lib/photo';
import type { Snapshot } from '@/lib/snapshot';
import { updateProfile } from '@/lib/store';
import { useToast } from '@/lib/toast';

/** Your name and your profile photo. Nothing else lives here. */
export function Settings({ s }: { s: Snapshot }) {
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(s.name);
  // undefined means the photo has not been touched. null means it is being removed.
  const [photo, setPhoto] = useState<string | null | undefined>(undefined);
  const [photoError, setPhotoError] = useState('');
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);

  const shownPhoto = photo === undefined ? s.photo : photo;
  const nameError = name.trim() === '' ? 'Enter a name' : '';
  const changed = name.trim() !== s.name || photo !== undefined;

  async function onPick(file: File | undefined) {
    if (!file) return;
    setPhotoError('');
    try {
      setPhoto(await photoFromFile(file));
    } catch (e) {
      setPhotoError(e instanceof PhotoError ? e.message : 'That image could not be used.');
    } finally {
      // Lets the same file be chosen again after removing it.
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (nameError || !changed) return;
    setBusy(true);
    await updateProfile({ name, photo });
    setBusy(false);
    setPhoto(undefined);
    setTouched(false);
    toast('Profile saved');
  }

  return (
    <form onSubmit={save} noValidate className="@container flex max-w-3xl flex-col gap-6">
      <PageHeader
        eyebrow="Settings"
        title="Profile"
        description="Your name and photo show up around the app and follow you to your other devices."
      />

      <Panel title="Profile photo" padded>
        <div className="flex flex-col items-start gap-5 @lg:flex-row @lg:items-center">
          <Avatar className="size-24 text-3xl">
            {shownPhoto && <AvatarImage src={shownPhoto} alt="Your profile photo" />}
            <AvatarFallback className="bg-primary text-3xl font-semibold text-primary-foreground">{(name.trim() || s.name || 'W').charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => fileInput.current?.click()}>
                <Camera /> {shownPhoto ? 'Change photo' : 'Add a photo'}
              </Button>
              {shownPhoto && (
                <Button type="button" variant="ghost" onClick={() => setPhoto(null)}>
                  <Trash2 /> Remove
                </Button>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Any JPEG, PNG or WebP. It is cropped to a square and shrunk on this device before it is saved.
            </p>
            {photoError && (
              <p role="alert" className="mt-2 text-xs text-destructive">
                {photoError}
              </p>
            )}
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            tabIndex={-1}
            aria-label="Choose a profile photo"
            onChange={(e) => void onPick(e.target.files?.[0])}
          />
        </div>
      </Panel>

      <Panel title="Name" padded>
        <Field label="Your name" error={touched ? nameError : ''}>
          {(id) => (
            <Input
              id={id}
              value={name}
              maxLength={40}
              autoComplete="given-name"
              aria-invalid={touched && !!nameError}
              onChange={(e) => setName(e.target.value)}
              className="h-11 md:h-9"
            />
          )}
        </Field>
      </Panel>

      <div className="flex flex-col gap-3 @lg:flex-row @lg:items-center">
        <Button type="submit" disabled={busy || !changed} className={`${primaryAction} @lg:w-auto @lg:px-6`}>
          Save changes
        </Button>
        {changed && (
          <Button
            type="button"
            variant="ghost"
            className="h-11 md:h-9"
            onClick={() => {
              setName(s.name);
              setPhoto(undefined);
              setPhotoError('');
              setTouched(false);
            }}
          >
            Discard
          </Button>
        )}
      </div>
    </form>
  );
}
