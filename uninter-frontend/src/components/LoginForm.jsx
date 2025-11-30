const LoginForm = ({ handleSubmit, handleUsernameChange, handlePasswordChange, username, password }) => {
  return (
    <div>
      <h2>Entrar</h2>

      <form onSubmit={handleSubmit}>
        <div>
          Usuário
          <input value={username} onChange={handleUsernameChange} />
        </div>
        <div>
          Senha
          <input type="password" value={password} onChange={handlePasswordChange} />
        </div>
        <button type="submit">Entrar</button>
      </form>
    </div>
  )
}

export default LoginForm
