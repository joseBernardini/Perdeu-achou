import { useCallback, useState } from 'react';
import { Pencil, Save } from 'lucide-react';
import Button from '../../components/Button/Button';
import FormAlert from '../../components/FormAlert/FormAlert';
import FormField, { getFieldDescriptionIds } from '../../components/FormField/FormField';
import TextField from '../../components/TextField/TextField';
import { useAuth } from '../../contexts/AuthContext';
import useFormSubmission from '../../hooks/useFormSubmission';
import { validateProfileForm } from '../../utils/authValidation';
import {
  AUTH_FIELD_LIMITS,
  PROFILE_TYPE_LABELS,
  SELECTABLE_PROFILE_TYPES,
  USER_ROLE_LABELS,
} from '../../utils/constants';
import '../Auth/Auth.css';

function ProfileForm({ user, onDone }) {
  const { updateProfile } = useAuth();

  const onSubmit = useCallback(
    async (values) => {
      await updateProfile(values);
      onDone(true);
    },
    [onDone, updateProfile]
  );

  const { values, errors, isSubmitting, submitError, formRef, handleChange, handleSubmit } = useFormSubmission({
    initialValues: {
      name: user.name,
      profileType: SELECTABLE_PROFILE_TYPES.includes(user.profileType) ? user.profileType : '',
    },
    validate: validateProfileForm,
    onSubmit,
  });

  return (
    <form ref={formRef} className="auth-form profile-panel__form" onSubmit={handleSubmit} noValidate>
      {submitError && (
        <FormAlert tone="error" title="Não foi possível salvar o perfil" autoFocus>
          {submitError}
        </FormAlert>
      )}

      <TextField
        id="perfil-nome"
        name="name"
        label="Nome"
        autoComplete="name"
        maxLength={AUTH_FIELD_LIMITS.name.max}
        value={values.name}
        onChange={handleChange}
        error={errors.name}
      />

      <FormField
        id="perfil-tipo"
        as="fieldset"
        label="Você é"
        hint="O tipo de perfil não concede permissões administrativas."
        error={errors.profileType}
      >
        <div className="auth-profile-options">
          {SELECTABLE_PROFILE_TYPES.map((type) => (
            <label key={type} className="auth-profile-option">
              <input
                type="radio"
                name="profileType"
                value={type}
                checked={values.profileType === type}
                onChange={handleChange}
                aria-invalid={errors.profileType ? true : undefined}
                aria-describedby={getFieldDescriptionIds('perfil-tipo', { hint: true, error: errors.profileType })}
              />
              <span>{PROFILE_TYPE_LABELS[type]}</span>
            </label>
          ))}
        </div>
      </FormField>

      <div className="profile-panel__actions">
        <Button type="submit" icon={Save} iconPosition="start" loading={isSubmitting} loadingText="Salvando">
          Salvar alterações
        </Button>
        <Button variant="ghost" onClick={() => onDone(false)} disabled={isSubmitting}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function ProfilePanel() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleDone = useCallback((wasSaved) => {
    setIsEditing(false);
    setSaved(wasSaved);
  }, []);

  return (
    <section className="profile-panel" aria-labelledby="meu-perfil">
      <div className="profile-panel__header">
        <h2 id="meu-perfil" className="user-area__title">
          Meu perfil
        </h2>
        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            icon={Pencil}
            iconPosition="start"
            onClick={() => {
              setSaved(false);
              setIsEditing(true);
            }}
          >
            Editar perfil
          </Button>
        )}
      </div>

      {saved && (
        <FormAlert tone="success" title="Perfil atualizado">
          As alterações foram salvas.
        </FormAlert>
      )}

      {isEditing ? (
        <ProfileForm user={user} onDone={handleDone} />
      ) : (
        <dl className="profile-panel__details">
          <div>
            <dt>Nome</dt>
            <dd>{user.name}</dd>
          </div>
          <div>
            <dt>E-mail</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Tipo de perfil</dt>
            <dd>{PROFILE_TYPE_LABELS[user.profileType] ?? PROFILE_TYPE_LABELS.nao_informado}</dd>
          </div>
          <div>
            <dt>Papel no sistema</dt>
            <dd>{USER_ROLE_LABELS[user.role]}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}

export default ProfilePanel;
